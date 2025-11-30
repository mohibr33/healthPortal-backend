import OpenAI from "openai";
import prisma from "../config/database";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class MedicalChatService {
  // System prompt for medical AI assistant
  private readonly SYSTEM_PROMPT = `You are a knowledgeable and empathetic medical AI assistant for a Pakistani healthcare platform. Your role is to:

1. Provide accurate, evidence-based medical information
2. Help users understand symptoms, conditions, and treatments
3. Suggest when to seek professional medical care
4. Be culturally sensitive to Pakistani healthcare context
5. Use simple, clear language that non-medical people can understand
6. Reference medicines available in Pakistan when relevant

IMPORTANT DISCLAIMERS:
- You are NOT a replacement for a licensed healthcare professional
- Always recommend consulting a doctor for diagnosis and treatment
- Never provide emergency medical advice - direct users to emergency services
- Do not prescribe medications - only provide general information

SAFETY GUIDELINES:
- For emergencies (chest pain, difficulty breathing, severe injuries): Immediately advise calling 1122 (Pakistan emergency) or visiting nearest hospital
- For mental health crises: Recommend professional help and crisis hotlines
- For medication questions: Provide general information but emphasize doctor consultation
- Be cautious with pregnancy, pediatric, and chronic disease advice

Your responses should be:
- Medically accurate and up-to-date
- Empathetic and supportive
- Clear and concise
- Culturally appropriate for Pakistan
- Always end with appropriate medical disclaimers when needed`;

  // Create new chat session
  async createChat(userId: string, firstMessage?: string): Promise<any> {
    const title = firstMessage
      ? this.generateTitle(firstMessage)
      : "New Medical Consultation";

    const chat = await prisma.medicalChat.create({
      data: {
        userId,
        title,
        status: "active",
      },
      include: {
        messages: {
          include: {
            attachments: true,
          },
        },
      },
    });

    return chat;
  }

  // Get user's chat sessions
  async getUserChats(
    userId: string,
    skip: number = 0,
    limit: number = 20,
    status?: string
  ): Promise<{ chats: any[]; total: number }> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [chats, total] = await Promise.all([
      prisma.medicalChat.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // Get last message for preview
            select: {
              content: true,
              createdAt: true,
              role: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.medicalChat.count({ where }),
    ]);

    return { chats, total };
  }

  // Get single chat with messages
  async getChatById(chatId: string, userId: string): Promise<any> {
    const chat = await prisma.medicalChat.findFirst({
      where: {
        id: chatId,
        userId, // Ensure user owns this chat
      },
      include: {
        messages: {
          include: {
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return chat;
  }

  // Send message and get AI response
  async sendMessage(
    chatId: string,
    userId: string,
    content: string,
    messageType: "text" | "voice" = "text",
    audioUrl?: string,
    audioDuration?: number,
    fileAttachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>
  ): Promise<any> {
    // Verify chat ownership
    const chat = await prisma.medicalChat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Save user message with attachments (if any)
    const userMessage = await prisma.chatMessage.create({
      data: {
        chatId,
        role: "user",
        content,
        messageType: fileAttachments && fileAttachments.length > 0 ? "file" : messageType,
        audioUrl,
        audioDuration,
        attachments: fileAttachments ? {
          create: fileAttachments.map((file) => ({
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            fileSize: file.fileSize,
          })),
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    // Build conversation history for AI
    const conversationHistory: any[] = [
      { role: "system", content: this.SYSTEM_PROMPT },
    ];

    // Add previous messages for context (text only)
    chat.messages.forEach((msg: any) => {
      conversationHistory.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    });

    // Build current message content with vision support
    const messageContent: any[] = [
      {
        type: "text",
        text: content,
      },
    ];

    // Add images to the message if present
    if (fileAttachments && fileAttachments.length > 0) {
      for (const file of fileAttachments) {
        if (file.fileType.startsWith("image/")) {
          // Convert image to base64 for GPT-4 Vision API
          const imagePath = path.join(__dirname, "../../", file.fileUrl);
          
          try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString("base64");
            const dataUrl = `data:${file.fileType};base64,${base64Image}`;

            messageContent.push({
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high", // Use "high" for detailed medical image analysis
              },
            });
          } catch (error) {
            console.error(`Error reading image ${file.fileName}:`, error);
            // Add text fallback if image can't be read
            messageContent.push({
              type: "text",
              text: `[Note: Could not load image ${file.fileName}]`,
            });
          }
        } else {
          // For non-image files (PDFs, documents), add text description
          messageContent.push({
            type: "text",
            text: `\n[User attached a ${file.fileType} file: ${file.fileName}. Please acknowledge this document and guide the user on what information to share from it.]`,
          });
        }
      }
    }

    // Add current message with vision content
    conversationHistory.push({
      role: "user",
      content: messageContent,
    });

    // Get AI response with vision support
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4o with vision capabilities
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content || "";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatId,
        role: "assistant",
        content: aiResponse,
        messageType: "text",
        tokens: tokensUsed,
      },
    });

    // Update chat timestamp and title if first message
    if (chat.messages.length === 0) {
      await prisma.medicalChat.update({
        where: { id: chatId },
        data: {
          title: this.generateTitle(content),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.medicalChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      userMessage,
      assistantMessage,
      tokensUsed,
    };
  }

  // Upload file attachment to message
  async addAttachment(
    messageId: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number
  ): Promise<any> {
    const attachment = await prisma.chatAttachment.create({
      data: {
        messageId,
        fileName,
        fileUrl,
        fileType,
        fileSize,
      },
    });

    return attachment;
  }

  // Transcribe voice message using Whisper API
  async transcribeAudio(audioFile: Buffer, fileName: string): Promise<string> {
    try {
      // Create a File object from buffer
      const file = new File([audioFile], fileName, {
        type: "audio/webm",
      });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "en", // Can be auto-detected or set to 'ur' for Urdu
      });

      return transcription.text;
    } catch (error: any) {
      console.error("Transcription error:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  // Update chat status
  async updateChatStatus(
    chatId: string,
    userId: string,
    status: "active" | "archived"
  ): Promise<any> {
    const chat = await prisma.medicalChat.updateMany({
      where: {
        id: chatId,
        userId,
      },
      data: { status },
    });

    return chat;
  }

  // Delete chat
  async deleteChat(chatId: string, userId: string): Promise<void> {
    await prisma.medicalChat.deleteMany({
      where: {
        id: chatId,
        userId,
      },
    });
  }

  // Generate chat title from first message
  private generateTitle(message: string): string {
    // Truncate to first 50 characters
    let title = message.substring(0, 50);
    if (message.length > 50) {
      title += "...";
    }
    return title;
  }

  // Get chat statistics
  async getChatStats(userId: string): Promise<any> {
    const [totalChats, activeChats, totalMessages, avgMessagesPerChat] =
      await Promise.all([
        prisma.medicalChat.count({ where: { userId } }),
        prisma.medicalChat.count({ where: { userId, status: "active" } }),
        prisma.chatMessage.count({
          where: { chat: { userId } },
        }),
        prisma.chatMessage
          .groupBy({
            by: ["chatId"],
            where: { chat: { userId } },
            _count: { id: true },
          })
          .then((groups: any[]) => {
            if (groups.length === 0) return 0;
            const total = groups.reduce(
              (sum: number, group: any) => sum + group._count.id,
              0
            );
            return Math.round(total / groups.length);
          }),
      ]);

    return {
      totalChats,
      activeChats,
      archivedChats: totalChats - activeChats,
      totalMessages,
      avgMessagesPerChat,
    };
  }
}

export default new MedicalChatService();

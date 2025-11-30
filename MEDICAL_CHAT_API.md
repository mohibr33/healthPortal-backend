# AI Medical Chat System - API Documentation

## Overview

The AI Medical Chat System allows users to have interactive medical consultations with an AI assistant powered by GPT-4. The system supports text messages, voice messages, and file attachments.

**Base Path:** `/api/medical-chat`

**Authentication:** All endpoints require JWT authentication

**AI Model:** GPT-4o with vision capabilities

---

## Features

✅ **Text Chat** - Send and receive text messages
✅ **Voice Messages** - Send voice recordings with automatic transcription
✅ **File Attachments** - Share medical reports, images, documents
✅ **Image Analysis** - AI can see and analyze uploaded medical images
✅ **Chat History** - Access previous conversations
✅ **Context Awareness** - AI remembers conversation history
✅ **Medical Safety** - Built-in disclaimers and emergency guidance

---

## Endpoints

### 1. Create New Chat Session

**Endpoint:** `POST /api/medical-chat`

**Access:** Protected (Requires JWT)

**Description:** Start a new medical chat session

**Request Body:**

```json
{
  "firstMessage": "I have been experiencing headaches for the past week"
}
```

**Validation:**
- `firstMessage`: Optional, 1-2000 characters

**Success Response (201):**

```json
{
  "success": true,
  "message": "Chat session created successfully",
  "data": {
    "id": "chat-id-123",
    "userId": "user-id-456",
    "title": "I have been experiencing headaches for the past...",
    "status": "active",
    "createdAt": "2025-11-26T10:00:00.000Z",
    "updatedAt": "2025-11-26T10:00:00.000Z",
    "messages": []
  }
}
```

---

### 2. Get All Chat Sessions

**Endpoint:** `GET /api/medical-chat`

**Access:** Protected (Requires JWT)

**Description:** Get all chat sessions for the logged-in user

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status ("active" or "archived")

**Example:** `GET /api/medical-chat?page=1&limit=10&status=active`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "chat-id-123",
        "userId": "user-id-456",
        "title": "I have been experiencing headaches",
        "status": "active",
        "createdAt": "2025-11-26T10:00:00.000Z",
        "updatedAt": "2025-11-26T10:15:00.000Z",
        "messages": [
          {
            "content": "Based on your symptoms, I recommend...",
            "createdAt": "2025-11-26T10:15:00.000Z",
            "role": "assistant"
          }
        ],
        "_count": {
          "messages": 8
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Single Chat by ID

**Endpoint:** `GET /api/medical-chat/:chatId`

**Access:** Protected (User can only view their own chats)

**Description:** Get a specific chat with full message history

**Example:** `GET /api/medical-chat/chat-id-123`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "chat-id-123",
    "userId": "user-id-456",
    "title": "I have been experiencing headaches",
    "status": "active",
    "createdAt": "2025-11-26T10:00:00.000Z",
    "updatedAt": "2025-11-26T10:15:00.000Z",
    "messages": [
      {
        "id": "msg-id-1",
        "chatId": "chat-id-123",
        "role": "user",
        "content": "I have been experiencing headaches for the past week",
        "messageType": "text",
        "audioUrl": null,
        "audioDuration": null,
        "transcription": null,
        "tokens": null,
        "createdAt": "2025-11-26T10:00:00.000Z",
        "attachments": []
      },
      {
        "id": "msg-id-2",
        "chatId": "chat-id-123",
        "role": "assistant",
        "content": "I understand you've been experiencing headaches for a week. Let me help you understand this better...",
        "messageType": "text",
        "audioUrl": null,
        "audioDuration": null,
        "transcription": null,
        "tokens": 245,
        "createdAt": "2025-11-26T10:00:05.000Z",
        "attachments": []
      }
    ]
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Chat not found"
}
```

---

### 4. Send Text Message (WITH Optional File Attachments)

**Endpoint:** `POST /api/medical-chat/:chatId/messages`

**Access:** Protected

**Description:** Send a text message and optionally attach files (images, documents, lab reports, etc.)

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `message`: Text message (required, 1-2000 characters)
- `files`: File attachments (optional, up to 5 files)

**Supported File Types:**
- Images: JPEG, JPG, PNG
- Documents: PDF, DOC, DOCX, TXT
- Max file size: 10MB per file

**Example 1: Text Only**

```bash
curl -X POST \\
  http://localhost:5050/api/medical-chat/chat-id-123/messages \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "message=What could be causing these headaches?"
```

**Example 2: Text + Single Image**

```bash
curl -X POST \\
  http://localhost:5050/api/medical-chat/chat-id-123/messages \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "message=Can you analyze this lab report for me?" \\
  -F "files=@lab-report.jpg"
```

**Example 3: Text + Multiple Files**

```bash
curl -X POST \\
  http://localhost:5050/api/medical-chat/chat-id-123/messages \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "message=Here are my blood test results and X-ray" \\
  -F "files=@blood-test.pdf" \\
  -F "files=@xray.jpg"
```

**Postman Example:**

1. Select POST method
2. URL: `/api/medical-chat/chat-id-123/messages`
3. Authorization → Bearer Token → Enter your JWT
4. Body → form-data
5. Add key `message` (type: Text) → Enter your message
6. Add key `files` (type: File) → Select file(s)
7. To add multiple files, add another `files` key and select another file

**Success Response (200) - Text Only:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "userMessage": {
      "id": "msg-id-3",
      "chatId": "chat-id-123",
      "role": "user",
      "content": "What could be causing these headaches?",
      "messageType": "text",
      "createdAt": "2025-11-26T10:05:00.000Z",
      "attachments": []
    },
    "assistantMessage": {
      "id": "msg-id-4",
      "chatId": "chat-id-123",
      "role": "assistant",
      "content": "Headaches can have various causes including:\n\n1. Tension headaches...\n2. Migraines...\n3. Dehydration...\n\n**Important:** If you experience severe symptoms like..., please seek immediate medical attention.\n\nWould you like me to provide more information about any specific type?",
      "messageType": "text",
      "tokens": 312,
      "createdAt": "2025-11-26T10:05:05.000Z"
    },
    "tokensUsed": 312
  }
}
```

**Success Response (200) - With File Attachments:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "userMessage": {
      "id": "msg-id-5",
      "chatId": "chat-id-123",
      "role": "user",
      "content": "Can you analyze this lab report for me?",
      "messageType": "file",
      "createdAt": "2025-11-26T10:10:00.000Z",
      "attachments": [
        {
          "id": "att-id-1",
          "fileName": "lab-report.jpg",
          "fileUrl": "/uploads/chat/1732603200000-123456789.jpg",
          "fileType": "image/jpeg",
          "fileSize": 245678,
          "uploadedAt": "2025-11-26T10:10:00.000Z"
        }
      ]
    },
    "assistantMessage": {
      "id": "msg-id-6",
      "chatId": "chat-id-123",
      "role": "assistant",
      "content": "Based on the image you've shared, this appears to be a **Clownfish** (Amphiprioninae). \n\nKey features I can see:\n- Orange body with distinctive white stripes\n- Black edges on the fins\n- Small to medium size\n\nClownfish are marine fish commonly found in coral reefs. They're popular in aquariums and known for their symbiotic relationship with sea anemones.\n\nIf you have health-related questions about consuming fish or fish allergies, please let me know!",
      "messageType": "text",
      "tokens": 156,
      "createdAt": "2025-11-26T10:10:05.000Z"
    },
    "tokensUsed": 156
  }
}
```

**Validation:**

- `message`: Required, 1-2000 characters
- `files`: Optional, max 5 files, 10MB each

**Error Response (400):**

```json
{
  "success": false,
  "message": "Message content is required"
}
```

**Error Response (400) - Invalid File:**

```json
{
  "success": false,
  "message": "Invalid file type. Allowed: images (jpg, png), documents (pdf, doc, docx, txt). Received: video/mp4"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Chat not found or access denied"
}
```

---

### 5. Send Voice Message

**Endpoint:** `POST /api/medical-chat/:chatId/voice`

**Access:** Protected

**Description:** Send a voice message. The audio will be automatically transcribed and sent to AI.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `audio`: Audio file (mp3, wav, webm, ogg, m4a)
- Max file size: 10MB

**Example using Postman:**
1. Select POST method
2. URL: `/api/medical-chat/chat-id-123/voice`
3. Body → form-data
4. Key: `audio` (type: File)
5. Value: Select your audio file

**Example using cURL:**

```bash
curl -X POST \
  http://localhost:5050/api/medical-chat/chat-id-123/voice \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@recording.mp3"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Voice message sent successfully",
  "data": {
    "userMessage": {
      "id": "msg-id-5",
      "chatId": "chat-id-123",
      "role": "user",
      "content": "I have been experiencing severe headaches lately",
      "messageType": "voice",
      "audioUrl": "/uploads/chat/1732603200000-123456789.mp3",
      "audioDuration": 0,
      "createdAt": "2025-11-26T10:10:00.000Z"
    },
    "assistantMessage": {
      "id": "msg-id-6",
      "chatId": "chat-id-123",
      "role": "assistant",
      "content": "I heard you say you've been experiencing severe headaches lately...",
      "messageType": "text",
      "tokens": 289,
      "createdAt": "2025-11-26T10:10:05.000Z"
    },
    "tokensUsed": 289,
    "transcription": "I have been experiencing severe headaches lately",
    "audioUrl": "/uploads/chat/1732603200000-123456789.mp3"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Audio file is required"
}
```

**Supported Audio Formats:**
- MP3 (`.mp3`)
- WAV (`.wav`)
- WebM (`.webm`)
- OGG (`.ogg`)
- M4A (`.m4a`)

---

### 6. Upload File Attachment ⚠️ **DEPRECATED**

**⚠️ This endpoint is deprecated. Use POST `/api/medical-chat/:chatId/messages` with files instead.**

**Endpoint:** `POST /api/medical-chat/:chatId/messages/:messageId/attachments`

**Access:** Protected

**Description:** ~~Upload a file attachment to a specific message (medical reports, lab results, images, etc.)~~

**Why Deprecated:**
This endpoint required users to first send a message, then upload files separately. The new approach allows sending messages and files in a single request.

**Migration Guide:**

**❌ OLD (Deprecated) - Two separate requests:**
```bash
# Step 1: Send message
curl -X POST \
  http://localhost:5050/api/medical-chat/chat-id-123/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Check my lab report"}'

# Step 2: Upload file to that message
curl -X POST \
  http://localhost:5050/api/medical-chat/chat-id-123/messages/msg-id-7/attachments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@lab-report.pdf"
```

**✅ NEW (Recommended) - Single request:**
```bash
# Send message + file together
curl -X POST \
  http://localhost:5050/api/medical-chat/chat-id-123/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "message=Check my lab report" \
  -F "files=@lab-report.pdf"
```

**Benefits of New Approach:**
- ✅ Single API call instead of two
- ✅ Simpler workflow (like WhatsApp/Telegram)
- ✅ Files and message sent together atomically
- ✅ AI sees images immediately with vision capabilities
- ✅ Support for multiple files (up to 5) in one request

**Error Response (410 Gone):**

```json
{
  "success": false,
  "message": "This endpoint is deprecated. Please use POST /api/medical-chat/:chatId/messages with 'files' in the request body instead."
}
```

**See Endpoint #4** for the new file upload method with examples.

---

### 7. Update Chat Status

**Endpoint:** `PATCH /api/medical-chat/:chatId/status`

**Access:** Protected

**Description:** Update chat status (active or archived)

**Request Body:**

```json
{
  "status": "archived"
}
```

**Valid Status Values:**
- `active` - Chat is active and visible in main list
- `archived` - Chat is archived (hidden from main view)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Chat archived successfully"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid status. Must be 'active' or 'archived'"
}
```

---

### 8. Delete Chat

**Endpoint:** `DELETE /api/medical-chat/:chatId`

**Access:** Protected

**Description:** Permanently delete a chat session and all its messages

**Success Response (200):**

```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

---

### 9. Get Chat Statistics

**Endpoint:** `GET /api/medical-chat/stats`

**Access:** Protected

**Description:** Get statistics about user's chat usage

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "totalChats": 12,
    "activeChats": 8,
    "archivedChats": 4,
    "totalMessages": 156,
    "avgMessagesPerChat": 13
  }
}
```

---

## AI Assistant Features

### Vision Capabilities (NEW)

The AI assistant can now **see and analyze images** using GPT-4o:

✅ **Medical Image Analysis** - Lab reports, X-rays, skin conditions
✅ **Prescription Reading** - Extract information from prescription images
✅ **Symptom Visualization** - Analyze photos of rashes, wounds, swelling
✅ **Document OCR** - Read text from medical documents and reports
✅ **General Image Recognition** - Identify objects, pills, medical equipment

**Supported Image Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- Maximum 10MB per image
- Up to 5 images per message

**Image Analysis Quality:**
- Uses "high" detail mode for medical images
- Can identify text, patterns, colors, and objects
- Provides detailed descriptions and medical insights

**Example Use Cases:**
- "Can you read the values from this blood test report?" + lab report image
- "What is this rash?" + skin photo
- "Is this medication the right one?" + pill/prescription image
- "Analyze this X-ray" + X-ray image

**Important Note:**
- AI provides general observations and guidance
- Not a replacement for professional medical diagnosis
- Always consult healthcare provider for definitive diagnosis

### Medical Expertise

The AI assistant is configured with:

✅ **Evidence-based medical knowledge**
✅ **Pakistani healthcare context awareness**
✅ **Medicine availability in Pakistan**
✅ **Cultural sensitivity**
✅ **Emergency response protocols**

### Safety Features

**Emergency Detection:**
- Recognizes emergency symptoms
- Directs users to call 1122 (Pakistan emergency)
- Advises hospital visits when needed

**Medical Disclaimers:**
- Not a replacement for professional care
- Always recommends doctor consultation
- Never prescribes medications

**Mental Health Support:**
- Recognizes crisis situations
- Provides crisis hotline information
- Recommends professional help

---

## Frontend Integration Examples

### React/Next.js Example

```javascript
// Create new chat
const createChat = async () => {
  const response = await fetch('http://localhost:5050/api/medical-chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstMessage: "I need medical advice"
    })
  });
  const data = await response.json();
  console.log('Chat created:', data);
};

// Send text message with files
const sendMessage = async (chatId, message, files = []) => {
  const formData = new FormData();
  formData.append('message', message);
  
  // Add multiple files
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  const response = await fetch(`http://localhost:5050/api/medical-chat/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const data = await response.json();
  return data;
};

// Usage example
const handleSend = async () => {
  const fileInput = document.getElementById('fileInput');
  const files = Array.from(fileInput.files);
  
  const result = await sendMessage(
    chatId,
    "Can you analyze these lab results?",
    files
  );
  
  console.log('AI Response:', result.data.assistantMessage.content);
};

// Send voice message
const sendVoiceMessage = async (chatId, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch(`http://localhost:5050/api/medical-chat/${chatId}/voice`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const data = await response.json();
  return data;
};
```

### Voice Recording Example (Web Audio API)

```javascript
let mediaRecorder;
let audioChunks = [];

// Start recording
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    await sendVoiceMessage(chatId, audioBlob);
    audioChunks = [];
  };
  
  mediaRecorder.start();
};

// Stop recording
const stopRecording = () => {
  mediaRecorder.stop();
};
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Chat not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message must be between 1 and 2000 characters"
    }
  ]
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "message": "File too large. Maximum size is 10MB"
}
```

---

## Best Practices

### For Developers

1. **Always handle errors gracefully**
2. **Show loading states during AI responses**
3. **Display transcriptions for voice messages**
4. **Implement file upload progress indicators**
5. **Store chat history locally for better UX**
6. **Show typing indicators when AI is responding**

### For Users

1. **Be specific about symptoms**
2. **Mention duration and severity**
3. **Share relevant medical history**
4. **Upload relevant documents/images**
5. **For image uploads:**
   - Ensure images are clear and well-lit
   - Include all relevant parts of lab reports
   - Take photos straight-on (not at an angle)
   - Use high resolution for better text recognition
6. **Always consult a doctor for serious concerns**

---

## Rate Limits

- **Message sending:** 60 requests per minute
- **File uploads:** 20 requests per minute
- **Chat creation:** 10 requests per minute

---

## Database Schema

### MedicalChat Table
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User)
- `title`: String
- `status`: Enum (active, archived)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### ChatMessage Table
- `id`: UUID (Primary Key)
- `chatId`: UUID (Foreign Key → MedicalChat)
- `role`: Enum (user, assistant)
- `content`: Text
- `messageType`: Enum (text, voice, file)
- `audioUrl`: String (nullable)
- `audioDuration`: Integer (nullable)
- `transcription`: Text (nullable)
- `tokens`: Integer (nullable)
- `createdAt`: DateTime

### ChatAttachment Table
- `id`: UUID (Primary Key)
- `messageId`: UUID (Foreign Key → ChatMessage)
- `fileName`: String
- `fileUrl`: String
- `fileType`: String
- `fileSize`: Integer
- `uploadedAt`: DateTime

---

## Migration Command

After updating the schema, run:

```bash
npx prisma migrate dev --name add_medical_chat_system
npx prisma generate
```

---

**Last Updated:** November 26, 2025

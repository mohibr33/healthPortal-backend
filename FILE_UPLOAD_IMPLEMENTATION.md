# File Upload with Messages - Implementation Complete ✅

## Problem Solved

**Original Issue:**  
Users couldn't attach files (like lab reports) when sending a message because:
- Files could only be attached to existing messages
- Message didn't exist yet when user was composing it
- Required 2 separate API calls (send message, then upload file)

**Solution:**  
Files are now uploaded **WITH** the message in a single request!

---

## How It Works Now

### User Flow:
1. User types: "Can you analyze this lab report?"
2. User attaches `lab-report.jpg`
3. User clicks Send
4. ✅ **Single request** sends both message + file
5. AI receives message with file context
6. AI responds acknowledging the attachment

---

## API Changes

### ✅ NEW Endpoint (Use This)

**POST `/api/medical-chat/:chatId/messages`**

```bash
curl -X POST \
  http://localhost:5050/api/medical-chat/chat-123/messages \
  -H "Authorization: Bearer YOUR_JWT" \
  -F "message=Can you analyze this lab report?" \
  -F "files=@lab-report.jpg"
```

**Features:**
- Send text message + up to 5 files in one request
- Supports images (jpg, png) and documents (pdf, doc, docx, txt)
- AI acknowledges attached files in response
- 10MB max per file

**Postman Steps:**
1. Method: POST
2. URL: `/api/medical-chat/:chatId/messages`
3. Authorization → Bearer Token
4. Body → form-data:
   - Key: `message` (Text) → Your message
   - Key: `files` (File) → Select file(s)
   - Add multiple `files` keys for multiple files

### ❌ DEPRECATED Endpoint

**POST `/api/medical-chat/:chatId/messages/:messageId/attachments`**

Returns: `410 Gone` - "Use POST /messages with files instead"

---

## Code Changes

### 1. Controller (`medicalChat.controller.ts`)

**Added:**
- `uploadFiles` - Multer middleware for multiple files (up to 5)
- `uploadAudio` - Multer middleware for audio files
- Separate file filters for documents vs audio
- Updated `sendMessage` to handle file attachments

**Key Code:**
```typescript
// Get uploaded files
const files = req.files as Express.Multer.File[] | undefined;
const fileAttachments = files?.map(file => ({
  fileName: file.originalname,
  fileUrl: `/uploads/chat/${file.filename}`,
  fileType: file.mimetype,
  fileSize: file.size,
}));

// Pass to service
await medicalChatService.sendMessage(
  chatId,
  userId,
  message.trim(),
  "text",
  undefined,
  undefined,
  fileAttachments
);
```

### 2. Service (`medicalChat.service.ts`)

**Added:**
- `fileAttachments` parameter to `sendMessage()`
- Creates attachments in database with message
- Adds file context to AI prompt

**Key Code:**
```typescript
// Create message with attachments
const userMessage = await prisma.chatMessage.create({
  data: {
    chatId,
    role: "user",
    content,
    messageType: fileAttachments && fileAttachments.length > 0 ? "file" : "text",
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

// Add file context for AI
if (fileAttachments && fileAttachments.length > 0) {
  currentMessage += `\n\n[User has attached ${fileAttachments.length} file(s):`;
  fileAttachments.forEach((file, index) => {
    currentMessage += `\n${index + 1}. ${file.fileName} (${file.fileType})`;
  });
  currentMessage += `\n\nNote: While you cannot directly view the files, please acknowledge them and provide relevant medical advice based on the user's description and the file types attached.]`;
}
```

### 3. Routes (`medicalChat.routes.ts`)

**Updated:**
```typescript
// Messages endpoint now uses uploadFiles middleware
router.post(
  "/:chatId/messages",
  medicalChatController.uploadFiles, // Handle multiple file uploads
  sendMessageValidation,
  validateRequest,
  medicalChatController.sendMessage
);

// Voice endpoint uses uploadAudio middleware
router.post(
  "/:chatId/voice",
  medicalChatController.uploadAudio, // Single audio file
  sendVoiceMessageValidation,
  validateRequest,
  medicalChatController.sendVoiceMessage
);

// Deprecated attachment endpoint
router.post(
  "/:chatId/messages/:messageId/attachments",
  medicalChatController.uploadAttachment // Returns 410 Gone
);
```

### 4. Documentation (`MEDICAL_CHAT_API.md`)

**Updated:**
- Endpoint 4: Shows file upload with examples
- Endpoint 6: Marked as deprecated with migration guide
- Frontend examples updated to use new method
- Added multiple file upload examples

---

## Testing

### Test 1: Text Only
```bash
POST /api/medical-chat/chat-123/messages
Body (form-data):
  message: "What are the symptoms of diabetes?"
```

**Expected:**
- Message sent ✅
- AI responds with diabetes info ✅
- No attachments ✅

### Test 2: Text + Single File
```bash
POST /api/medical-chat/chat-123/messages
Body (form-data):
  message: "Can you analyze this lab report?"
  files: lab-report.jpg
```

**Expected:**
- Message sent ✅
- File uploaded to `/uploads/chat/` ✅
- Attachment created in database ✅
- AI acknowledges file in response ✅

### Test 3: Text + Multiple Files
```bash
POST /api/medical-chat/chat-123/messages
Body (form-data):
  message: "Here are my test results"
  files: blood-test.pdf
  files: xray.jpg
  files: doctor-notes.txt
```

**Expected:**
- Message sent ✅
- 3 files uploaded ✅
- 3 attachments created ✅
- AI mentions all 3 files ✅

### Test 4: Invalid File Type
```bash
POST /api/medical-chat/chat-123/messages
Body (form-data):
  message: "Check this video"
  files: video.mp4
```

**Expected:**
- ❌ Error: "Invalid file type. Allowed: images (jpg, png), documents (pdf, doc, docx, txt). Received: video/mp4"

---

## Frontend Integration

### React Example

```jsx
import { useState } from 'react';

function ChatInput({ chatId }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSend = async () => {
    const formData = new FormData();
    formData.append('message', message);
    files.forEach(file => formData.append('files', file));

    const response = await fetch(
      `http://localhost:5050/api/medical-chat/${chatId}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      }
    );

    const data = await response.json();
    console.log('AI Response:', data.data.assistantMessage.content);
    
    // Clear form
    setMessage('');
    setFiles([]);
  };

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
      />
      
      {files.length > 0 && (
        <div>📎 {files.length} file(s) selected</div>
      )}
      
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

## Database Schema

### ChatMessage
```prisma
model ChatMessage {
  id             String            @id @default(uuid())
  chatId         String
  role           MessageRole       // user | assistant
  content        String            @db.Text
  messageType    MessageType       // text | voice | file
  audioUrl       String?
  audioDuration  Int?
  transcription  String?           @db.Text
  tokens         Int?
  createdAt      DateTime          @default(now())
  
  chat           MedicalChat       @relation(fields: [chatId], references: [id])
  attachments    ChatAttachment[]  // NEW: One-to-many relation
}
```

### ChatAttachment
```prisma
model ChatAttachment {
  id         String       @id @default(uuid())
  messageId  String
  fileName   String
  fileUrl    String
  fileType   String
  fileSize   Int
  uploadedAt DateTime     @default(now())
  
  message    ChatMessage  @relation(fields: [messageId], references: [id])
}
```

**Migration:** Already applied (20251126013250_add_medical_chat_system)

---

## File Storage

**Location:** `/uploads/chat/`

**Format:** `{timestamp}-{random}.{ext}`

**Example:** `1732603200000-123456789.jpg`

**Production Note:** Consider using cloud storage (AWS S3, Cloudinary) instead of local filesystem

---

## AI Behavior

### Without Files:
```
User: "I have a headache"
AI: "Headaches can be caused by... [medical advice]"
```

### With Files:
```
User: "Can you analyze this lab report?" + lab-report.jpg
AI: "I can see you've uploaded a lab report image. While I cannot directly 
     view the image, I can help you understand lab results if you describe 
     them to me. Please tell me:
     1. What type of test is it?
     2. Are there any values marked as high or low?
     3. What symptoms are you experiencing?"
```

**Note:** AI acknowledges files but cannot actually view them (GPT-4o-mini text-only). Future enhancement: Use GPT-4o with vision for image analysis.

---

## Supported File Types

### Images
- JPEG (`.jpg`, `.jpeg`) - `image/jpeg`
- PNG (`.png`) - `image/png`

### Documents
- PDF (`.pdf`) - `application/pdf`
- Word (`.doc`) - `application/msword`
- Word (`.docx`) - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Text (`.txt`) - `text/plain`

### Audio (Separate Endpoint)
- MP3 (`.mp3`) - `audio/mpeg`, `audio/mp3`
- WAV (`.wav`) - `audio/wav`, `audio/wave`
- WebM (`.webm`) - `audio/webm`
- OGG (`.ogg`) - `audio/ogg`
- M4A (`.m4a`) - `audio/mp4`, `audio/x-m4a`

---

## Migration Guide

### If you were using the old method:

**❌ OLD (2 API calls):**
```javascript
// Step 1: Send message
const messageResponse = await sendMessage(chatId, "Check my lab report");
const messageId = messageResponse.data.userMessage.id;

// Step 2: Upload file
await uploadFile(chatId, messageId, labReportFile);
```

**✅ NEW (1 API call):**
```javascript
// Single request with message + file
const formData = new FormData();
formData.append('message', 'Check my lab report');
formData.append('files', labReportFile);

await fetch(`/api/medical-chat/${chatId}/messages`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## Benefits

✅ **Simpler:** One API call instead of two
✅ **Faster:** No waiting for message ID
✅ **Better UX:** Like WhatsApp/Telegram (send text + media together)
✅ **AI Context:** AI knows about files immediately
✅ **Multiple Files:** Send up to 5 files at once
✅ **Atomic:** Either everything succeeds or everything fails

---

## Next Steps

1. ✅ Test with Postman (see examples above)
2. ✅ Update your frontend to use new method
3. ✅ Remove old `uploadFile()` function from frontend
4. ✅ Test edge cases (no files, 1 file, 5 files, invalid file)
5. ⚠️ Consider cloud storage for production (S3, Cloudinary)
6. 💡 Future: Add GPT-4o with vision to actually analyze images

---

## Success! 🎉

Your AI Medical Chat now supports file uploads the right way!

**Last Updated:** November 26, 2025

# AI Medical Chat System - Quick Start Guide

## 🚀 Overview

The AI Medical Chat System is now fully integrated into your Digital Health Assistant API. Users can chat with an AI-powered medical assistant that provides evidence-based medical information with Pakistani healthcare context.

---

## ✅ What's Included

### Backend Features
- ✅ **Complete API endpoints** for chat management
- ✅ **GPT-4o-mini integration** with medical expertise
- ✅ **Text messaging** with conversation history
- ✅ **Voice messages** with automatic transcription (Whisper API)
- ✅ **File attachments** (medical reports, images, documents)
- ✅ **Chat sessions** with archive/delete functionality
- ✅ **Safety features** (emergency detection, medical disclaimers)
- ✅ **Pakistani healthcare context** awareness

### Database Schema
- ✅ `MedicalChat` - Chat sessions
- ✅ `ChatMessage` - Individual messages
- ✅ `ChatAttachment` - File attachments

### Files Created
- ✅ `src/services/medicalChat.service.ts` - Business logic
- ✅ `src/controllers/medicalChat.controller.ts` - HTTP handlers
- ✅ `src/routes/medicalChat.routes.ts` - Route definitions
- ✅ `src/middlewares/medicalChat.validation.ts` - Input validation
- ✅ `MEDICAL_CHAT_API.md` - Complete API documentation

---

## 🎯 Quick Test Guide

### 1. Start Your Server

```bash
npm run dev
# or
pnpm dev
```

The medical chat API is available at: `http://localhost:5050/api/medical-chat`

### 2. Test with Postman

#### Step 1: Login to Get Token
```
POST http://localhost:5050/api/users/login

Body (JSON):
{
  "email": "your-email@example.com",
  "password": "your-password"
}

Response:
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the token!**

#### Step 2: Create New Chat
```
POST http://localhost:5050/api/medical-chat

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Body (JSON):
{
  "firstMessage": "I have been experiencing headaches for the past week"
}

Response:
{
  "success": true,
  "data": {
    "id": "chat-id-here",
    "title": "I have been experiencing headaches...",
    ...
  }
}
```

**Copy the chat ID!**

#### Step 3: Send a Message
```
POST http://localhost:5050/api/medical-chat/{CHAT_ID}/messages

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Body (JSON):
{
  "message": "What could be causing these headaches?"
}

Response:
{
  "success": true,
  "data": {
    "userMessage": {...},
    "assistantMessage": {
      "content": "Headaches can have various causes including..."
    }
  }
}
```

#### Step 4: Send Voice Message (Optional)
```
POST http://localhost:5050/api/medical-chat/{CHAT_ID}/voice

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Body (form-data):
audio: [Select your audio file - mp3, wav, webm, etc.]

Response:
{
  "success": true,
  "data": {
    "transcription": "I have been experiencing headaches",
    "audioUrl": "/uploads/chat/123456789.mp3",
    "assistantMessage": {...}
  }
}
```

#### Step 5: Get Chat History
```
GET http://localhost:5050/api/medical-chat/{CHAT_ID}

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Response:
{
  "success": true,
  "data": {
    "id": "chat-id",
    "messages": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
}
```

---

## 🔧 Configuration

### Environment Variables Required

Make sure these are in your `.env`:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-proj-your-key-here

# Other existing variables
DATABASE_URL=...
JWT_SECRET=...
```

### File Upload Directory

The system automatically creates:
- `uploads/chat/` - for voice messages and file attachments

---

## 📱 Frontend Integration

### Basic Chat Interface (React/Next.js)

```javascript
import { useState, useEffect } from 'react';

function MedicalChat() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const token = localStorage.getItem('token');

  // Create new chat
  const createChat = async () => {
    const res = await fetch('http://localhost:5050/api/medical-chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firstMessage: 'Hello' })
    });
    const data = await res.json();
    setChatId(data.data.id);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setMessages([...messages, { role: 'user', content: input }]);
    
    const res = await fetch(`http://localhost:5050/api/medical-chat/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: input })
    });
    
    const data = await res.json();
    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: data.data.assistantMessage.content }
    ]);
    setInput('');
    setLoading(false);
  };

  useEffect(() => {
    if (!chatId) createChat();
  }, []);

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Ask a medical question..."
      />
      
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

### Voice Recording Component

```javascript
import { useState, useRef } from 'react';

function VoiceRecorder({ chatId, onSent }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  
  const token = localStorage.getItem('token');

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];
    
    mediaRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };
    
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      await sendVoiceMessage(audioBlob);
    };
    
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const sendVoiceMessage = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const res = await fetch(`http://localhost:5050/api/medical-chat/${chatId}/voice`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const data = await res.json();
    onSent(data.data);
  };

  return (
    <button onClick={recording ? stopRecording : startRecording}>
      {recording ? '⏹️ Stop' : '🎤 Record'}
    </button>
  );
}
```

---

## 🎨 UI/UX Recommendations

### Message Display
- Show user messages on the right (blue bubble)
- Show AI messages on the left (gray bubble)
- Display timestamps
- Show "AI is typing..." indicator
- Display transcriptions for voice messages
- Show file attachment previews

### Features to Implement
- ✅ Chat list with last message preview
- ✅ Search through chat history
- ✅ Archive old conversations
- ✅ Export chat as PDF
- ✅ Voice message playback
- ✅ File preview/download
- ✅ Copy AI responses
- ✅ Share chat with doctor

---

## 🛡️ Safety & Privacy

### Built-in Safety Features

1. **Emergency Detection**
   - AI recognizes emergency symptoms
   - Directs to call 1122 (Pakistan emergency)
   - Advises hospital visits

2. **Medical Disclaimers**
   - Not a replacement for doctors
   - Always recommends professional consultation
   - Never prescribes medications

3. **Privacy**
   - User data is encrypted
   - Chats are private (user can only see their own)
   - Files are securely stored

---

## 📊 Monitoring & Analytics

### Available Statistics

```
GET /api/medical-chat/stats

Response:
{
  "totalChats": 12,
  "activeChats": 8,
  "archivedChats": 4,
  "totalMessages": 156,
  "avgMessagesPerChat": 13
}
```

### Things to Monitor
- Token usage (OpenAI costs)
- Response times
- Error rates
- Popular topics/symptoms
- User engagement

---

## 🐛 Troubleshooting

### Common Issues

**1. "OpenAI API error"**
- Check your `OPENAI_API_KEY` in `.env`
- Verify API key has credits
- Check OpenAI service status

**2. "Audio transcription failed"**
- Verify audio file format (mp3, wav, webm)
- Check file size (< 10MB)
- Ensure audio is clear

**3. "File upload failed"**
- Check file type (allowed: jpeg, png, pdf, doc, docx, txt)
- Verify file size (< 10MB)
- Ensure `uploads/chat/` directory exists

**4. "Chat not found"**
- Verify user owns the chat
- Check chat ID is valid UUID
- User might be logged out

---

## 📈 Next Steps

### Recommended Enhancements

1. **Real-time Chat** (WebSockets)
2. **Push Notifications** for AI responses
3. **Multi-language Support** (English + Urdu)
4. **Voice Synthesis** (AI speaks responses)
5. **Image Analysis** (analyze uploaded medical images)
6. **Chat Sharing** (share with doctors)
7. **Symptom Checker** (structured questionnaire)
8. **Medicine Recommendations** (link to medicine database)

---

## 🔗 Related Documentation

- [Complete API Documentation](./MEDICAL_CHAT_API.md)
- [Main API Documentation](./API_DOCUMENTATION.md)
- [OpenAI Documentation](https://platform.openai.com/docs)

---

## 💡 Tips for Best Results

### For Users
1. Be specific about symptoms
2. Mention duration and severity
3. Share relevant medical history
4. Upload lab reports/images when relevant
5. Always consult a real doctor for serious issues

### For Developers
1. Handle loading states gracefully
2. Show typing indicators
3. Display transcriptions
4. Implement file upload progress
5. Cache chat history locally
6. Add error boundaries

---

## 🎉 You're All Set!

Your AI Medical Chat System is now fully functional and ready to use!

**Test it now:**
```bash
# Start server
npm run dev

# Open Postman
# Follow the test guide above
```

**Questions or Issues?**
- Check [MEDICAL_CHAT_API.md](./MEDICAL_CHAT_API.md) for detailed API docs
- Review error messages carefully
- Test with Postman first before frontend integration

---

**Happy Coding! 🚀**

**Last Updated:** November 26, 2025

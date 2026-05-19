# CNT-Project: End-to-End Encrypted Real-Time Chat Platform

## Project Overview

CNT-Project is a secure, real-time messaging platform that implements hybrid RSA + AES encryption for end-to-end encrypted communication. The platform eliminates vulnerabilities associated with traditional messaging systems by ensuring messages are encrypted on the client-side and can only be decrypted by the intended recipient.

### Problem Statement
Current messaging systems are vulnerable to:
- Surveillance and metadata collection
- Message interception by third parties
- Lack of true end-to-end encryption
- Centralized data storage risks

### Solution
A decentralized-architecture-inspired secure chat platform using hybrid cryptography:
- RSA for secure key exchange
- AES for efficient message encryption
- Real-time communication via WebSockets
- Client-side encryption/decryption

## Core Features

### Essential Features
1. **Real-time Chat**
   - Instant message delivery
   - Typing indicators
   - Message status (sent, delivered, read)
   - Chat history persistence

2. **RSA Public Key Exchange**
   - Automatic key pair generation (2048-bit RSA)
   - Secure public key sharing
   - Key verification mechanisms

3. **AES Encrypted Sessions**
   - Unique AES-256-GCM key per conversation
   - Session key encryption with RSA
   - Message encryption/decryption on client-side

4. **Message Authentication**
   - HMAC-SHA256 for message integrity
   - Digital signatures for non-repudiation
   - Tamper detection

5. **Online User System**
   - Real-time user presence
   - Online/offline status
   - Last seen timestamps

6. **Secure Key Storage**
   - Client-side private key storage
   - Encrypted key backup options
   - Key rotation mechanisms

### Advanced Features
1. **Voice Notes**
   - Audio recording and playback
   - Encrypted voice message transmission
   - Compression for efficient storage

2. **File Transfer**
   - Secure file sharing
   - Large file chunking
   - Progress indicators
   - File type validation

3. **Self-Destructing Messages**
   - Time-based message expiration
   - Automatic deletion from all devices
   - Expiration timers (seconds to days)

4. **QR Public Key Exchange**
   - QR code generation for public keys
   - Camera-based key scanning
   - Contactless key exchange

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### Security & Cryptography
- **Web Crypto API** - Browser-based cryptography
- **RSA-OAEP** - Asymmetric encryption for key exchange
- **AES-GCM** - Symmetric encryption for messages
- **PBKDF2** - Key derivation
- **HMAC-SHA256** - Message authentication

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Capacitor** - Cross-platform mobile development
- **Hardhat/Ethers** - Blockchain integration (if needed)

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Client A      │◄──────────────►│     Server      │
│  (Browser)      │                │  (Express +    │
│                 │                │   Socket.IO)   │
└─────────────────┘                └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│   Client B      │                │    MongoDB      │
│  (Browser)      │                │   Database      │
└─────────────────┘                └─────────────────┘
```

### Component Architecture
1. **Client-Side Components**
   - Chat Interface
   - Key Management
   - Encryption/Decryption Engine
   - Real-time Connection Handler

2. **Server-Side Components**
   - Authentication Service
   - Message Relay Service
   - User Presence Service
   - Database Interface

3. **Database Layer**
   - User Collection
   - Message Collection
   - Key Exchange Collection
   - Session Management

## Encryption Flow

### Hybrid RSA + AES Encryption Process

#### 1. Key Generation Phase
```
Client A: Generate RSA Key Pair (2048-bit)
- Public Key: Shared with server and other clients
- Private Key: Stored securely in browser (IndexedDB/LocalStorage)

Client B: Generate RSA Key Pair (2048-bit)
- Same process as Client A
```

#### 2. Session Establishment
```
Client A → Server: Request chat with Client B
Server → Client A: Send Client B's Public Key
Server → Client B: Send Client A's Public Key

Client A: Generate AES Session Key (256-bit)
Client A: Encrypt AES Key with Client B's Public RSA Key
Client A → Server: Send encrypted AES Key

Server → Client B: Relay encrypted AES Key
Client B: Decrypt AES Key using own Private RSA Key
```

#### 3. Message Encryption
```
For each message:
1. Generate random IV (96-bit for GCM)
2. Encrypt message with AES-GCM: ciphertext + auth tag
3. Create HMAC of ciphertext for additional integrity
4. Bundle: {iv, ciphertext, hmac, timestamp}
5. Send bundle via WebSocket
```

#### 4. Message Decryption
```
Receiving client:
1. Verify HMAC
2. Decrypt ciphertext with AES-GCM using session key
3. Verify authentication tag
4. Display decrypted message
```

### Key Exchange Protocol
- **RSA Key Exchange**: Public keys are exchanged through the server
- **AES Session Keys**: Generated per conversation, encrypted with recipient's RSA public key
- **Perfect Forward Secrecy**: New AES key for each conversation session
- **Key Rotation**: Periodic key updates for enhanced security

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  publicKey: String, // PEM format RSA public key
  keyFingerprint: String, // SHA-256 hash of public key
  createdAt: Date,
  lastSeen: Date,
  isOnline: Boolean,
  avatar: String, // URL or base64
  preferences: {
    theme: String,
    notifications: Boolean,
    sound: Boolean
  }
}
```

### Message Collection
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  recipientId: ObjectId,
  encryptedContent: String, // Base64 encoded encrypted bundle
  messageType: String, // 'text', 'voice', 'file'
  timestamp: Date,
  status: String, // 'sent', 'delivered', 'read'
  expiresAt: Date, // For self-destructing messages
  metadata: {
    fileName: String, // For file messages
    fileSize: Number,
    mimeType: String,
    voiceDuration: Number
  }
}
```

### Conversation Collection
```javascript
{
  _id: ObjectId,
  participants: [ObjectId], // Array of user IDs
  createdAt: Date,
  lastMessageAt: Date,
  encryptedSessionKey: String, // AES key encrypted with participants' public keys
  conversationType: String, // 'direct', 'group'
  settings: {
    selfDestructTimer: Number, // Default timer in seconds
    allowVoiceNotes: Boolean,
    allowFileTransfer: Boolean
  }
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get online users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/public-key` - Update public key
- `GET /api/users/search?q=username` - Search users

### Messages
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/status` - Update message status
- `DELETE /api/messages/:id` - Delete message (self-destruct)

### Keys
- `GET /api/keys/public/:userId` - Get user's public key
- `POST /api/keys/exchange` - Initiate key exchange

## Real-Time Events (Socket.IO)

### Client Events
- `join` - Join user's personal room
- `join-conversation` - Join conversation room
- `send-message` - Send encrypted message
- `typing-start` - Indicate typing
- `typing-stop` - Stop typing indicator
- `mark-read` - Mark messages as read
- `user-online` - Update online status

### Server Events
- `user-joined` - New user online
- `user-left` - User went offline
- `new-message` - New message received
- `typing` - User is typing
- `message-status-update` - Message status changed
- `conversation-update` - Conversation metadata updated

## Security Measures

### Client-Side Security
1. **Private Key Protection**
   - Stored in browser's secure storage
   - Encrypted with user password/PBKDF2
   - Never transmitted to server

2. **Memory Management**
   - Session keys cleared after conversation ends
   - Sensitive data zeroed out in memory

3. **Input Validation**
   - All user inputs sanitized
   - File uploads restricted by type and size

### Server-Side Security
1. **Transport Security**
   - HTTPS/WSS only
   - Certificate pinning
   - HSTS headers

2. **Authentication**
   - JWT tokens with expiration
   - Refresh token rotation
   - Rate limiting

3. **Data Protection**
   - Encrypted database storage
   - Regular security audits
   - Backup encryption

### Network Security
1. **End-to-End Encryption**
   - Messages encrypted before transmission
   - Server cannot read message content
   - Metadata minimization

2. **Forward Secrecy**
   - Unique keys per session
   - Key rotation mechanisms

## Implementation Plan

### Phase 1: Core Infrastructure
1. Set up Next.js project with TypeScript
2. Configure Tailwind CSS and Framer Motion
3. Set up Express server with Socket.IO
4. Configure MongoDB connection
5. Implement basic user authentication

### Phase 2: Cryptography Implementation
1. Implement RSA key generation (Web Crypto API)
2. Implement AES encryption/decryption
3. Create key exchange protocol
4. Build encryption service layer

### Phase 3: Real-Time Chat
1. Implement Socket.IO client integration
2. Build chat UI components
3. Implement message sending/receiving
4. Add typing indicators and presence

### Phase 4: Advanced Features
1. Voice notes recording/playback
2. File transfer functionality
3. Self-destructing messages
4. QR code key exchange

### Phase 5: Security & Testing
1. Security audit and penetration testing
2. Performance optimization
3. Cross-browser compatibility testing
4. Mobile responsiveness

### Phase 6: Deployment
1. Set up production server
2. Configure SSL certificates
3. Database optimization
4. Monitoring and logging

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start backend server (separate terminal)
cd server
npm run dev
```

### Testing
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint
```

### Building for Production
```bash
# Build frontend
pnpm build

# Build backend
cd server && npm run build

# Start production server
npm start
```

## Deployment Architecture

### Production Setup
- **Frontend**: Vercel/Netlify for static hosting
- **Backend**: Heroku/Railway/DigitalOcean for API server
- **Database**: MongoDB Atlas for cloud database
- **WebSocket**: Socket.IO with Redis adapter for scaling
- **CDN**: Cloudflare for global distribution

### Scaling Considerations
- Horizontal scaling with load balancer
- Redis for session storage and caching
- Database sharding for large user base
- CDN for static assets

## Risk Assessment & Mitigation

### Security Risks
1. **Private Key Compromise**
   - Mitigation: Client-side storage, user education

2. **Man-in-the-Middle Attacks**
   - Mitigation: Certificate pinning, key verification

3. **Server Compromise**
   - Mitigation: Encrypted data storage, minimal metadata

### Technical Risks
1. **Web Crypto API Browser Support**
   - Mitigation: Fallback libraries, browser detection

2. **Real-Time Connection Issues**
   - Mitigation: Automatic reconnection, offline queuing

3. **Database Performance**
   - Mitigation: Indexing, query optimization, caching

## Future Enhancements

### Planned Features
1. **Group Chat**
   - Multi-party encryption
   - Group key management

2. **Message Reactions**
   - Encrypted reaction storage
   - Real-time reaction updates

3. **Message Search**
   - Client-side encrypted search
   - Index generation

4. **Backup & Restore**
   - Encrypted chat history backup
   - Cross-device synchronization

### Technology Upgrades
1. **WebAssembly Cryptography**
   - Faster encryption/decryption
   - Hardware acceleration

2. **Progressive Web App**
   - Offline functionality
   - Push notifications

3. **Blockchain Integration**
   - Decentralized key storage
   - Timestamp verification

## Conclusion

CNT-Project represents a comprehensive solution for secure real-time communication, combining the security of hybrid cryptography with the usability of modern web technologies. The platform provides true end-to-end encryption while maintaining real-time performance and user-friendly features.

The hybrid RSA+AES approach ensures both security and efficiency, making it suitable for various use cases from personal messaging to professional communications requiring high security standards.

This project serves as an excellent portfolio piece for cybersecurity and full-stack development, demonstrating expertise in cryptography, real-time systems, and secure application architecture.
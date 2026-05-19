Secure Email Encryption System using Hybrid Encryption (RSA + AES)
Problem Statement

Emails transmitted through networks may be intercepted by attackers during transmission or accessed by unauthorized users if email servers are compromised. Sensitive information such as personal details, business documents, passwords, financial records, and confidential files can become vulnerable to security threats.

Traditional email systems often depend mainly on server-side protection, which can create risks if attackers gain access to stored data. Therefore, there is a need for a secure email communication system that ensures confidentiality, secure key exchange, and protected file transmission.

The objective of this project is to design and develop a Secure Email Encryption System using Hybrid Encryption (RSA + AES) that protects both email content and attachments during transmission and storage.

The system combines two encryption techniques:

AES (Advanced Encryption Standard)
Used to encrypt the email body and attachments because it provides fast encryption for large amounts of data.
RSA (Rivest–Shamir–Adleman)
Used to securely encrypt and exchange the AES encryption key.
Working of the Algorithm

When a user sends an email:

User composes an email and optionally attaches files.
The system generates a random AES session key.
Email content and attachments are encrypted:
Ciphertext = AES(Email Content, Key)
The AES key is encrypted using the receiver’s RSA public key:
Encrypted Key = RSA(AES Key)
The following are transmitted together:
Encrypted Email Content
Encrypted Attachments
Encrypted AES Key
On the receiver side:
RSA private key decrypts the AES key
AES key decrypts email content
Original message and attachments are restored
System Objectives
Protect email content from unauthorized access
Secure attachments during transmission
Ensure safe encryption key exchange
Maintain confidentiality and data integrity
Prevent interception of sensitive information
Provide secure communication between users
Features
Compose and send emails
Encrypt email body using AES
Encrypt attachments before transmission
RSA public/private key generation
Secure key exchange
Decrypt received emails
User login and authentication
Secure message transmission
Inbox and sent mail management
Email history storage
Attachment download and decryption
Secure key handling
Expected Outcome

The final system should provide a secure email platform where users can safely send and receive emails and attachments while ensuring that only authorized recipients can decrypt and access the original information. This system should reduce the risk of message interception and improve overall communication security.
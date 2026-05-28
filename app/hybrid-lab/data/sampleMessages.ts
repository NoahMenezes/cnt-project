export interface SampleMessage {
  id: number;
  label: string;
  text: string;
}

export interface RSAKeyPair {
  label: string;
  publicKey: string;
  privateKey: string;
}

export interface SampleMessagesData {
  sampleMessages: SampleMessage[];
  rsaKeyPairs: RSAKeyPair[];
}

const sampleMessages: SampleMessagesData = {
  sampleMessages: [
    {
      id: 1,
      label: "Simple greeting",
      text: "Hello, this is a test message for hybrid RSA-AES encryption demonstration.",
    },
    {
      id: 2,
      label: "Financial transaction",
      text: "TRANSFER: $50,000 USD from Account #8821-4492 to Account #9934-2210. Authorization Code: TXN-20240614-8821.",
    },
    {
      id: 3,
      label: "Medical record",
      text: "Patient ID: 00428-B. Diagnosis: Hypertension Stage 2. Prescription: Lisinopril 10mg. Physician: Dr. Sarah Okonkwo.",
    },
    {
      id: 4,
      label: "Military-grade test",
      text: "CLASSIFIED: Operation Nightfall. Coordinates 34.0522° N, 118.2437° W. Timestamp 0300 UTC. Authentication required.",
    },
  ],
  rsaKeyPairs: [
    {
      label: "2048-bit (Recommended)",
      publicKey:
        "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplBQLF29amygykE\nMmYz0+Kcj3bKBp29nNGMmFqSJRfBCQGpROHNsNSGvBMeIoGJe5hJNXvCBOHPjW7\nkQzFPvMlgQxZ2l3oHhWrDdoWm7p8nXbqYr3tK9mEsNj4vUwBcLsxRfPkAeQhT2w\nU9k6hMJl3nVpKdZrWzPfY8oXgBqLsE7mNtCvHjT1cKuRbQpMwDn5yXsZe9FGkA3\noI4jVtSr6uNhXYlWzKpsMo2bTqE8rJDvUcBnLeQfHw1PzkG9TmVsXiOdYjRuCkap\n4eN3QBvlhsMoKrEdTfPyWzXjUqHnLtCwBsZoDpRlk7m8xFvAqGcYiOeNb2JRKSDA\n-----END PUBLIC KEY-----",
      privateKey:
        "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA2a2rwplBQLzXoTq9RJFNEuH4mBvFKsKZOAHYVWFkDLoRKnHs\nrTCvMbEqpDs7YxHnBwNlPmKsQftZgLvUjRoWd9XiOeN2KBMA7cLhDsYpRnFwT3Gq\nbX8mZvJlsETkYpH3wKNqLr5oDs9mFvXtR8gBcZpKsUnTLvmNjQrH4wDoFpXsYbzN\noT5RJvmCsKEqL3bNhWsT9DpYlKmFsXvBrZoM2eNjQKcTs8LvHmYpXrE5wKnBsDtC\nfZoTL7mYpRsE3qNjKvXwBsZoTr8pFmYqNL5DsXvBrKoE9pFjYsKmXwTrB4NqLsZo\nF3mYpKsRvT8qNjXwBoLsDtCrZoF5pTmYqKNjXvBsLoE7qFsDpTrYmKNjXwBsLoZo\n-----END RSA PRIVATE KEY-----",
    },
  ],
};

export default sampleMessages;

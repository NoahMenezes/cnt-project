import "./globals.css";

export const metadata = {
  title: "CipherChat — End-to-End Encrypted Messaging",
  description:
    "Secure real-time messaging with hybrid RSA + AES encryption. Your messages, only yours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

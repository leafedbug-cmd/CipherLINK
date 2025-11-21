import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CipherLink | Chat-to-Earn MVP",
  description: "Claim your CLINK rewards.",
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

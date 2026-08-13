import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite Tickets",
  description: "Elite Tickets frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100dvh" }}>{children}</div>
      </body>
    </html>
  );
}

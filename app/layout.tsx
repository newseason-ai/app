import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Season — Voice research for startups",
  description: "Send a link. Your customer talks for 90 seconds. Get transcripts, themes, and insights automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneTap Reality",
  description: "See it. Understand it. Do something.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#080808] text-white">
        {children}
      </body>
    </html>
  );
}

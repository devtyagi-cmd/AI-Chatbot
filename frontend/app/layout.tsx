import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast-context";

export const metadata: Metadata = {
  title: "AI Data Chatbot",
  description: "Upload a CSV or Excel file and ask questions about it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام إدارة المبيعات والمخازن",
  description: "نظام متكامل لإدارة المخزون والمبيعات والمشتريات والحسابات",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-foreground font-sans">
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}

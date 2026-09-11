import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: {
    default: "CGFK School Management System",
    template: "%s | CGFK School",
  },
  description:
    "Student registration, attendance and school report management system.",

  icons: {
    icon: [
      {
        url: "/lo.png",
        type: "image/png",
      },
    ],
    shortcut: "/lo.png",
    apple: "/lo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

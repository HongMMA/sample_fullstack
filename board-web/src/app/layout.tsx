import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "게시판 | Board",
  description: "Spring Boot + Next.js 게시판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
          {children}
        </div>
      </body>
    </html>
  );
}

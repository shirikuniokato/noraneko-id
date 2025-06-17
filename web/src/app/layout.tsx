import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { createAuth } from "@noranekoid/nextjs/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noraneko ID Admin",
  description: "Noraneko ID 管理コンソール",
};

// 認証エンジンを初期化
createAuth({
  clientId: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || 'admin-dashboard-001',
  issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER || 'http://localhost:8080',
  redirectUri: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/auth/callback',
  scopes: ['openid', 'profile', 'email', 'admin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

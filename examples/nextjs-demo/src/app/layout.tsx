import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NoranekoIDProvider } from '@noraneko/id-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "noraneko-id Demo App",
  description: "Next.js demo application for noraneko-id authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NoranekoIDProvider
          config={{
            clientId: process.env.NORANEKO_CLIENT_ID || 'demo-client',
            issuer: process.env.NORANEKO_ISSUER || 'http://localhost:8080',
            redirectUri: `${process.env.NORANEKO_APP_URL || 'http://localhost:3001'}/auth/callback`,
            scopes: ['openid', 'profile', 'email'],
          }}
        >
          {children as any}
        </NoranekoIDProvider>
      </body>
    </html>
  );
}

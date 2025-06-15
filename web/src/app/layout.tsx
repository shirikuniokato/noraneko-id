import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NoranekoIDNextJSProvider } from '@noraneko/id-react/nextjs/client';

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
        <NoranekoIDNextJSProvider
          config={{
            issuer: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
            clientId: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || 'admin-dashboard-001',
            redirectUri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
            scopes: ['openid', 'profile', 'email', 'admin'],
            useHttpOnlyCookies: true,
            apiRoute: {
              basePath: '/api/auth',
            },
          }}
        >
          {children}
        </NoranekoIDNextJSProvider>
      </body>
    </html>
  );
}

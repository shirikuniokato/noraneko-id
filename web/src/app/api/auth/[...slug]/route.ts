import { createNoranekoIDHandler } from '@noraneko/id-react/nextjs/server';

const config = {
  issuer: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  clientId: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || 'admin-dashboard-001',
  redirectUri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  scopes: ['openid', 'profile', 'email', 'admin'],
  apiRoute: {
    basePath: '/api/auth',
  },
};

console.log('NoranekoID API Handler Config:', config);

export const { GET, POST, DELETE } = createNoranekoIDHandler(config);
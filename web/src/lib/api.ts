import { 
  User, 
  OAuthClient, 
  LoginRequest, 
  RegisterRequest, 
  CreateClientRequest, 
  CreateClientResponse
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // セッションクッキーを含める
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 認証関連
  auth = {
    login: async (data: LoginRequest) => {
      return this.request<{ user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    register: async (data: RegisterRequest) => {
      return this.request<{ user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    logout: async () => {
      return this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    },

    profile: async () => {
      return this.request<{ user: User }>('/auth/profile');
    },
  };

  // OAuth2クライアント管理
  oauth2 = {
    listClients: async () => {
      return this.request<{ clients: OAuthClient[]; total: number }>('/admin/clients');
    },

    getClient: async (id: string) => {
      return this.request<OAuthClient>(`/admin/clients/${id}`);
    },

    createClient: async (data: CreateClientRequest) => {
      return this.request<CreateClientResponse>('/admin/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateClient: async (id: string, data: Partial<CreateClientRequest>) => {
      return this.request<OAuthClient>(`/admin/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    deleteClient: async (id: string) => {
      return this.request<void>(`/admin/clients/${id}`, {
        method: 'DELETE',
      });
    },

    regenerateSecret: async (id: string) => {
      return this.request<OAuthClient>(`/admin/clients/${id}/regenerate-secret`, {
        method: 'POST',
      });
    },
  };

  // ヘルスチェック
  health = async () => {
    return this.request<{ status: string; service: string; environment: string }>('/health');
  };
}

export const api = new ApiClient();
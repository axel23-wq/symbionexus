const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers },
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: { ...this.getHeaders(), ...options.headers },
        });
        return retryResponse.json();
      }
      // Redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erreur serveur');
    }
    return data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Listings
  async getListings(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/listings${query}`);
  }

  async getListing(id: string) {
    return this.request<any>(`/listings/${id}`);
  }

  async getMyListings() {
    return this.request<any>('/listings/my');
  }

  async createListing(data: any) {
    return this.request<any>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateListing(id: string, data: any) {
    return this.request<any>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async publishListing(id: string) {
    return this.request<any>(`/listings/${id}/publish`, { method: 'PATCH' });
  }

  // Matches
  async computeMatches(listingId: string) {
    return this.request<any>(`/matches/compute/${listingId}`, { method: 'POST' });
  }

  async getMyMatches() {
    return this.request<any>('/matches/my');
  }

  async getMatch(id: string) {
    return this.request<any>(`/matches/${id}`);
  }

  async acceptMatch(id: string) {
    return this.request<any>(`/matches/${id}/accept`, { method: 'PATCH' });
  }

  async rejectMatch(id: string) {
    return this.request<any>(`/matches/${id}/reject`, { method: 'PATCH' });
  }

  // Contracts
  async generateContract(matchId: string) {
    return this.request<any>(`/contracts/generate/${matchId}`, { method: 'POST' });
  }

  async signContract(id: string) {
    return this.request<any>(`/contracts/${id}/sign`, { method: 'PATCH' });
  }

  async getMyContracts() {
    return this.request<any>('/contracts/my');
  }

  async getContract(id: string) {
    return this.request<any>(`/contracts/${id}`);
  }

  // Passports
  async createPassport(contractId: string) {
    return this.request<any>(`/passports/create/${contractId}`, { method: 'POST' });
  }

  async getPassport(id: string) {
    return this.request<any>(`/passports/${id}`);
  }

  async updateTransportStatus(passportId: string, status: string) {
    return this.request<any>(`/passports/${passportId}/status/${status}`, { method: 'PATCH' });
  }

  // Carbon
  async generateCarbonCredit(passportId: string) {
    return this.request<any>(`/carbon/generate/${passportId}`, { method: 'POST' });
  }

  async getMyCarbonCredits() {
    return this.request<any>('/carbon/my');
  }

  async getCarbonStats() {
    return this.request<any>('/carbon/stats');
  }

  // Dashboard
  async getDashboard() {
    return this.request<any>('/dashboard');
  }

  async getAdminDashboard() {
    return this.request<any>('/dashboard/admin');
  }

  // Messages
  async sendMessage(receiverCompanyId: string, content: string, matchId?: string) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverCompanyId, content, matchId }),
    });
  }

  async getConversations() {
    return this.request<any>('/messages/conversations');
  }

  async getConversation(partnerId: string) {
    return this.request<any>(`/messages/conversation/${partnerId}`);
  }

  // Notifications
  async getNotifications() {
    return this.request<any>('/notifications');
  }

  async getUnreadCount() {
    return this.request<any>('/notifications/count');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  // Companies
  async getCompanies() {
    return this.request<any>('/companies');
  }

  async getCompany(id: string) {
    return this.request<any>(`/companies/${id}`);
  }
}

export const api = new ApiClient();

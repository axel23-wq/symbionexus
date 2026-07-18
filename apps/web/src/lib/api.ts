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
  async login(email: string, password: string, rememberMe = false) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
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

  // Directory
  async searchDirectory(params: Record<string, any>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          v.forEach(val => qs.append(k, val));
        } else {
          qs.append(k, String(v));
        }
      }
    }
    return this.request<any>(`/directory?${qs.toString()}`);
  }

  async getDirectoryCompany(id: string) {
    return this.request<any>(`/directory/${id}`);
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

  async deleteListing(id: string) {
    return this.request<any>(`/listings/${id}`, { method: 'DELETE' });
  }

  // Matches
  async computeAiMatch(listingId: string) {
    return this.request<any>(`/ai/match/${listingId}`, { method: 'POST' });
  }

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

  // Analytics
  async getCompanyAnalytics() {
    return this.request<any>('/analytics/company');
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

  // Settings — profil / identité B2B
  async getSettingsProfile() {
    return this.request<any>('/settings/profile');
  }

  async updateCompanyProfile(data: { name?: string; registrationNumber?: string; logoUrl?: string; description?: string }) {
    return this.request<any>('/settings/company', { method: 'PATCH', body: JSON.stringify(data) });
  }

  async addCertification(data: { type: string; title: string; fileUrl: string; expiresAt?: string }) {
    return this.request<any>('/settings/certifications', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteCertification(id: string) {
    return this.request<any>(`/settings/certifications/${id}`, { method: 'DELETE' });
  }

  // Settings — préférences / notifications
  async updatePreferences(data: { locale?: string; theme?: string }) {
    return this.request<any>('/settings/preferences', { method: 'PATCH', body: JSON.stringify(data) });
  }

  async updateNotifications(prefs: Record<string, boolean>) {
    return this.request<any>('/settings/notifications', { method: 'PATCH', body: JSON.stringify({ prefs }) });
  }

  // Settings — passerelle développeur
  async updateWebhook(webhookUrl: string) {
    return this.request<any>('/settings/webhook', { method: 'PATCH', body: JSON.stringify({ webhookUrl }) });
  }

  async listApiKeys() {
    return this.request<any>('/settings/api-keys');
  }

  async createApiKey(label: string) {
    return this.request<any>('/settings/api-keys', { method: 'POST', body: JSON.stringify({ label }) });
  }

  async revokeApiKey(id: string) {
    return this.request<any>(`/settings/api-keys/${id}`, { method: 'DELETE' });
  }

  // Settings — journal d'audit
  async getAuditLog() {
    return this.request<any>('/settings/audit');
  }

  // Passeports — export PDF + preuve de livraison
  async downloadPassportPdf(id: string) {
    const res = await fetch(`${this.baseUrl}/passports/${id}/pdf`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Échec de la génération du PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passeport-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async savePassportProof(id: string, data: { signature?: string; photo?: string }) {
    return this.request<any>(`/passports/${id}/proof`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  // Crédits carbone — marché secondaire, vente, compensation, certificat
  async getCarbonMarket() {
    return this.request<any>('/carbon/market');
  }

  async listCarbonCredit(id: string, pricePerTonne?: number) {
    return this.request<any>(`/carbon/${id}/list`, { method: 'PATCH', body: JSON.stringify({ pricePerTonne }) });
  }

  async unlistCarbonCredit(id: string) {
    return this.request<any>(`/carbon/${id}/unlist`, { method: 'PATCH' });
  }

  async retireCarbonCredit(id: string) {
    return this.request<any>(`/carbon/${id}/retire`, { method: 'PATCH' });
  }

  async downloadCarbonCertificate(id: string) {
    const res = await fetch(`${this.baseUrl}/carbon/${id}/certificate`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Échec de la génération du certificat');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificat-carbone-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Market Intelligence Engine
  async getMIShortages() {
    return this.request<any>('/market-intelligence/shortages');
  }
  async getMIPredictions() {
    return this.request<any>('/market-intelligence/predictions');
  }
  async getMIFraudDetection() {
    return this.request<any>('/market-intelligence/fraud');
  }
  async getMICapacityBalancing() {
    return this.request<any>('/market-intelligence/capacity');
  }
  async getMITrustScores() {
    return this.request<any>('/market-intelligence/trust-scores');
  }
  async getMIGlobal() {
    return this.request<any>('/market-intelligence/global');
  }

  // Collecte citoyenne temps réel (flux réel : DB + events + wallet)
  async submitCollection(dto: { materialCategory: string; declaredWeightKg: number; phone?: string; latitude?: number; longitude?: number }) {
    return this.request<any>('/collection', { method: 'POST', body: JSON.stringify(dto) });
  }
  async analyzeCollection(image: string) {
    return this.request<any>('/collection/analyze', { method: 'POST', body: JSON.stringify({ image }) });
  }
  async analyzeVideo(video: string) {
    return this.request<any>('/collection/analyze-video', { method: 'POST', body: JSON.stringify({ video }) });
  }
  async getMyCollections() {
    return this.request<any>('/collection/my');
  }
  async getAnalytics() {
    return this.request<any>('/collection/analytics');
  }
  async getWallet() {
    return this.request<any>('/collection/wallet');
  }
  async assignCollection(id: string) {
    return this.request<any>(`/collection/${id}/assign`, { method: 'PATCH' });
  }
  async validateCollection(id: string, validatedWeightKg: number) {
    return this.request<any>(`/collection/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ validatedWeightKg }) });
  }
  async payCollection(id: string) {
    return this.request<any>(`/collection/${id}/pay`, { method: 'PATCH' });
  }

  // Décaissement Mobile Money (pipeline réel, adaptateur swappable)
  async requestPayout(amount: number, phone: string) {
    return this.request<any>('/payments/payout', { method: 'POST', body: JSON.stringify({ amount, phone }) });
  }
  async getMyPayouts() {
    return this.request<any>('/payments/payouts');
  }
  // Outil DEV temporaire : simule le webhook prestataire (retiré en prod)
  async devConfirmPayout(providerRef: string, status: 'CONFIRMED' | 'FAILED' = 'CONFIRMED') {
    return this.request<any>('/payments/dev/confirm', { method: 'POST', body: JSON.stringify({ providerRef, status }) });
  }
  // Logistics GPS
  async getLogisticsTransports() {
    return this.request<any>('/logistics/active-transports');
  }
}

export const api = new ApiClient();

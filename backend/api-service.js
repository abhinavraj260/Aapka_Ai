// ── API Service Layer for Backend Integration ────────────────
// Handles all communication with backend services

class APIService {
  constructor(config) {
    this.baseURL = config.api.base;
    this.firebase = config.firebase;
    this.offlineMode = config.features.offlineModeEnabled;
  }

  /**
   * Perform authenticated API call
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (this.offlineMode) {
        console.warn('Offline mode - using cached data:', error);
        return this.getCachedResponse(endpoint);
      }
      throw error;
    }
  }

  /**
   * Get auth token from Chrome storage
   */
  async getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get('authToken', (data) => {
        resolve(data.authToken || null);
      });
    });
  }

  /**
   * Get cached response for offline support
   */
  getCachedResponse(endpoint) {
    return new Promise((resolve) => {
      chrome.storage.local.get(`cache_${endpoint}`, (data) => {
        resolve(data[`cache_${endpoint}`] || null);
      });
    });
  }

  /**
   * Cache API response
   */
  async cacheResponse(endpoint, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [`cache_${endpoint}`]: data }, resolve);
    });
  }

  // ── USER AUTHENTICATION ────────────────────────────────

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data.token) {
      await this.saveAuthToken(data.token);
    }
    return data;
  }

  async signup(email, password, name) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: { email, password, name }
    });
    if (data.token) {
      await this.saveAuthToken(data.token);
    }
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    await this.clearAuthToken();
  }

  async getUserProfile() {
    const data = await this.request('/user/profile');
    await this.cacheResponse('/user/profile', data);
    return data;
  }

  /**
   * Save auth token to Chrome storage
   */
  async saveAuthToken(token) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ authToken: token }, resolve);
    });
  }

  /**
   * Clear auth token
   */
  async clearAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('authToken', resolve);
    });
  }

  // ── VOICE COMMANDS ─────────────────────────────────────

  async processVoiceCommand(text, context = {}) {
    return await this.request('/ai/process-voice', {
      method: 'POST',
      body: {
        command: text,
        url: context.url,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log command to backend
   */
  async logCommand(command, result, context = {}) {
    return await this.request('/commands', {
      method: 'POST',
      body: {
        command,
        result,
        context,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get command history
   */
  async getCommandHistory(limit = 50) {
    return await this.request(`/commands?limit=${limit}`);
  }

  // ── UTILITY ────────────────────────────────────────────

  isOnline() {
    return navigator.onLine;
  }

  setOfflineMode(enabled) {
    this.offlineMode = enabled;
  }
}

// Export service
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}

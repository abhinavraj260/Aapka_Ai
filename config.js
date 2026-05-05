// ── Backend Configuration ──────────────────────────────────────
// This file centrally manages all backend configurations

const CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyDVPfajXYZ_placeholder_key_12345abcde",
    authDomain: "aapka-ai.firebaseapp.com",
    projectId: "aapka-ai",
    storageBucket: "aapka-ai.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
  },
  
  // API Endpoints
  api: {
    base: "https://api.aapka-ai.com",
    endpoints: {
      login: "/auth/login",
      signup: "/auth/signup",
      logout: "/auth/logout",
      userProfile: "/user/profile",
      commands: "/commands",
      voice: "/ai/process-voice"
    }
  },
  
  // Feature Flags
  features: {
    firebaseEnabled: true,
    offlineModeEnabled: true,
    cacheResponses: true
  }
};

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

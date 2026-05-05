// ── Updated Service Worker with Backend Integration ──────────

// Import config and API service
importScripts('config.js');
importScripts('backend/api-service.js');

// Initialize API service
const apiService = new APIService(CONFIG);

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI ASSISTANT Voice Navigator installed — backend integrated.');
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-login') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('login/login.html')
    });
  }
});

// ── Listen for messages from popup/content scripts ────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_AUTH') {
    checkAuth().then(sendResponse);
    return true;
  }

  if (request.type === 'API_REQUEST') {
    handleAPIRequest(request.data).then(sendResponse);
    return true;
  }

  if (request.type === 'LOG_COMMAND') {
    logCommandToBackend(request.data).then(sendResponse);
    return true;
  }
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  try {
    const token = await apiService.getAuthToken();
    return { authenticated: !!token };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

/**
 * Handle API requests from content/popup scripts
 */
async function handleAPIRequest(data) {
  try {
    const response = await apiService.request(data.endpoint, data.options);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Log voice commands to backend
 */
async function logCommandToBackend(data) {
  try {
    const result = await apiService.logCommand(
      data.command,
      data.result,
      { url: data.url }
    );
    return { success: true, data: result };
  } catch (error) {
    console.warn('Failed to log command:', error);
    return { success: false, error: error.message };
  }
}

// ── Sync offline commands when connection restored ────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_OFFLINE') {
    syncOfflineCommands().then(sendResponse);
    return true;
  }
});

async function syncOfflineCommands() {
  return new Promise((resolve) => {
    chrome.storage.local.get('offlineCommands', async (data) => {
      const commands = data.offlineCommands || [];
      
      for (const cmd of commands) {
        try {
          await apiService.logCommand(cmd.command, cmd.result, cmd.context);
        } catch (error) {
          console.warn('Failed to sync command:', error);
        }
      }

      chrome.storage.local.set({ offlineCommands: [] });
      resolve({ synced: commands.length });
    });
  });
}

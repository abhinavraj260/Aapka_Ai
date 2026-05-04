// AI ASSISTANT Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI ASSISTANT Voice Navigator installed — no backend required.');
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-login') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('login/login.html')
    });
  }
});
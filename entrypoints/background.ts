import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('[Stickle Background] Service worker initialized.');

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Stickle Background] Received message:', message);
    if (message?.type === 'PING') {
      sendResponse({ type: 'PONG', timestamp: Date.now() });
    }
    return true; // Keep message channel open for async response
  });
});

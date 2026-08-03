import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[Stickle Content] Script injected into page:', window.location.href);

    // Send PING message to background service worker
    chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Stickle Content] Message failed:', chrome.runtime.lastError.message);
      } else {
        console.log('[Stickle Content] Response from background:', response);
      }
    });
  },
});

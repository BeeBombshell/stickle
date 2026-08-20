import { defineBackground } from 'wxt/sandbox';
import posthog from '../lib/posthog';
import {
  testNotionConnectionDirect,
  pushNoteToNotionDirect,
  exportUnsyncedNotesBatchDirect,
} from '../lib/notion';
import { validateUserTier } from '../lib/auth';

export default defineBackground(() => {
  if (import.meta.env.DEV) console.log('[Stickle Background] Service worker initialized.');
  posthog.init();

  // Schedule 24-hour periodic alarm for license tier validation
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    try {
      chrome.alarms.create('check-license-tier', { periodInMinutes: 1440 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm?.name === 'check-license-tier') {
          validateUserTier(true).catch(() => {});
        }
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[Stickle Background] Alarm registration skipped:', err);
    }
  }

  // Create context menu item & handle first-run onboarding on install
  if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener((details) => {
      if (chrome.contextMenus?.create) {
        try {
          chrome.contextMenus.create(
            {
              id: 'stickle-add-note',
              title: '📌 Add Stickle Note Here',
              contexts: ['all'],
            },
            () => {
              if (chrome.runtime?.lastError) {
                // Ignore harmless duplicate menu error on reload
              }
            }
          );
        } catch {}
      }

      if (details.reason === 'install' && chrome.tabs?.create) {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') }, () => {
            if (chrome.runtime?.lastError) {
              // Ignore headless window creation error during automated installation testing
            }
          });
        } catch {}
      }
    });
  }

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'stickle-add-note' && tab?.id) {
      // Check if URL is restricted (e.g. chrome:// or chrome-extension://)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
        console.warn('[Stickle] Cannot inject content script into restricted page:', tab.url);
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_CREATE_NOTE' }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[Stickle] Could not send message to tab:', chrome.runtime.lastError.message);
        }
      });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'PING') {
      sendResponse({ type: 'PONG', timestamp: Date.now() });
      return true;
    }

    if (message?.type === 'TRACK_ANALYTICS_EVENT') {
      posthog.capture(message.eventName, message.properties);
      sendResponse?.({ success: true });
      return true;
    }


    if (message?.type === 'NOTION_TEST_CONNECTION') {
      testNotionConnectionDirect(message.config)
        .then((res) => sendResponse({ success: true, result: res }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async channel open
    }

    if (message?.type === 'NOTION_PUSH_NOTE') {
      pushNoteToNotionDirect(message.note, message.config)
        .then((notionPageId) => sendResponse({ success: true, notionPageId }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async channel open
    }

    if (message?.type === 'NOTION_EXPORT_BATCH') {
      exportUnsyncedNotesBatchDirect(message.notes, message.config)
        .then((res) => sendResponse({ success: true, result: res }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async channel open
    }

    return true;
  });
});

import { defineBackground } from 'wxt/sandbox';
import {
  testNotionConnectionDirect,
  pushNoteToNotionDirect,
  exportUnsyncedNotesBatchDirect,
} from '../lib/notion';

export default defineBackground(() => {
  console.log('[Stickle Background] Service worker initialized.');

  // Create context menu item on install/startup
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'stickle-add-note',
      title: '📌 Add Stickle Note Here',
      contexts: ['all'],
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'stickle-add-note' && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_CREATE_NOTE' });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'PING') {
      sendResponse({ type: 'PONG', timestamp: Date.now() });
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

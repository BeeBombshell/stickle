import { defineBackground } from 'wxt/sandbox';
import {
  testNotionConnectionDirect,
  pushNoteToNotionDirect,
  exportUnsyncedNotesBatchDirect,
} from '../lib/notion';

export default defineBackground(() => {
  console.log('[Stickle Background] Service worker initialized.');

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

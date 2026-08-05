import type { StickleNote, NotionConfig } from './types';
import { updateNote } from './db';

const NOTION_VERSION = '2022-06-28';

export function cleanDatabaseId(rawId: string): string {
  const trimmed = rawId.trim();
  // If user pasted a full Notion database URL, extract the 32-char ID
  const urlMatch = trimmed.match(/([a-f0-9]{32})/i) || trimmed.match(/([a-f0-9-]{36})/i);
  if (urlMatch) {
    return urlMatch[1].replace(/-/g, '');
  }
  return trimmed.replace(/-/g, '');
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfterHeader = res.headers.get('Retry-After');
      const delay = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : Math.pow(2, attempt) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
      continue;
    }
    return res;
  }
  throw new Error('Max retries exceeded');
}

export async function testNotionConnectionDirect(
  config: NotionConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiKey.trim()) {
    return { success: false, error: 'Integration Token is required.' };
  }
  if (!config.databaseId.trim()) {
    return { success: false, error: 'Database ID is required.' };
  }

  const dbId = cleanDatabaseId(config.databaseId);

  try {
    const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${dbId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        'Notion-Version': NOTION_VERSION,
      },
    });

    if (res.ok) {
      return { success: true };
    }

    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || `Notion API returned status ${res.status}`;
    return { success: false, error: message };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Notion API. Check your internet connection.',
    };
  }
}

export async function pushNoteToNotionDirect(
  note: StickleNote,
  config: NotionConfig
): Promise<string> {
  if (!config.apiKey.trim() || !config.databaseId.trim()) {
    throw new Error('Notion settings incomplete. Please set Integration Token and Database ID.');
  }

  const dbId = cleanDatabaseId(config.databaseId);
  const headers = {
    Authorization: `Bearer ${config.apiKey.trim()}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  const formattedDate = new Date(note.createdAt).toISOString();
  const titleText = note.pageTitle || note.url;

  if (note.syncedToNotion && note.notionPageId) {
    // Update existing Notion page properties
    const updateUrl = `https://api.notion.com/v1/pages/${note.notionPageId}`;
    const updateBody = {
      properties: {
        Name: {
          title: [{ text: { content: titleText } }],
        },
        URL: {
          url: note.url,
        },
      },
    };

    const res = await fetchWithRetry(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateBody),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to update Notion page (${res.status})`);
    }

    // Append updated content as a new block paragraph to Notion page
    const appendBlocksUrl = `https://api.notion.com/v1/blocks/${note.notionPageId}/children`;
    await fetchWithRetry(appendBlocksUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: `[Updated Note]: ${note.content}`,
                  },
                },
              ],
            },
          },
        ],
      }),
    }).catch(() => {}); // Non-critical block append

    await updateNote(note.id, {
      syncedToNotion: true,
      updatedAt: Date.now(),
    });

    return note.notionPageId;
  } else {
    // Create new Notion page in database
    const createUrl = 'https://api.notion.com/v1/pages';
    const createBody = {
      parent: { database_id: dbId },
      properties: {
        Name: {
          title: [{ text: { content: titleText } }],
        },
        URL: {
          url: note.url,
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: note.content,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'callout',
          callout: {
            icon: { emoji: '📌' },
            rich_text: [
              {
                text: {
                  content: `Created via Stickle on ${formattedDate} | Anchor: ${note.anchor.tier}`,
                },
              },
            ],
          },
        },
      ],
    };

    const res = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to create Notion page (${res.status})`);
    }

    const responseData = await res.json();
    const notionPageId = responseData.id;

    await updateNote(note.id, {
      syncedToNotion: true,
      notionPageId,
      updatedAt: Date.now(),
    });

    return notionPageId;
  }
}

export async function exportUnsyncedNotesBatchDirect(
  notes: StickleNote[],
  config: NotionConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<{ successCount: number; failCount: number }> {
  const unsynced = notes.filter((n) => !n.syncedToNotion);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < unsynced.length; i++) {
    try {
      await pushNoteToNotionDirect(unsynced[i], config);
      successCount++;
    } catch {
      failCount++;
    }
    if (onProgress) {
      onProgress(i + 1, unsynced.length);
    }
  }

  return { successCount, failCount };
}

// Background Proxy Routing wrappers to bypass CORS in Content Script & Popup contexts
function shouldRouteThroughBackground(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof chrome !== 'undefined' &&
    Boolean(chrome.runtime?.sendMessage)
  );
}

export async function testNotionConnection(
  config: NotionConfig
): Promise<{ success: boolean; error?: string }> {
  if (shouldRouteThroughBackground()) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'NOTION_TEST_CONNECTION', config },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else if (response?.success) {
            resolve(response.result);
          } else {
            resolve({ success: false, error: response?.error || 'Background message failed' });
          }
        }
      );
    });
  }
  return testNotionConnectionDirect(config);
}

export async function pushNoteToNotion(
  note: StickleNote,
  config: NotionConfig
): Promise<string> {
  if (shouldRouteThroughBackground()) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'NOTION_PUSH_NOTE', note, config },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.success) {
            resolve(response.notionPageId);
          } else {
            reject(new Error(response?.error || 'Background export failed'));
          }
        }
      );
    });
  }
  return pushNoteToNotionDirect(note, config);
}

export async function exportUnsyncedNotesBatch(
  notes: StickleNote[],
  config: NotionConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<{ successCount: number; failCount: number }> {
  if (shouldRouteThroughBackground()) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'NOTION_EXPORT_BATCH', notes, config },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.success) {
            resolve(response.result);
          } else {
            reject(new Error(response?.error || 'Background batch export failed'));
          }
        }
      );
    });
  }
  return exportUnsyncedNotesBatchDirect(notes, config, onProgress);
}

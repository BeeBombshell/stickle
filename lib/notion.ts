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

function formatNotionApiError(res: Response, errorData: any): string {
  if (res.status === 401) {
    return 'Notion Integration Token is invalid or expired. Please check your token in Settings.';
  }
  if (res.status === 403) {
    return 'Notion Integration Token does not have access to this database. Make sure to share your Notion database with the integration connection.';
  }
  if (res.status === 404) {
    return 'Notion Database not found. Please double-check your Database ID in Settings.';
  }
  return errorData?.message || `Notion API returned HTTP ${res.status}`;
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
    const message = formatNotionApiError(res, errorData);
    return { success: false, error: message };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Notion API. Check your internet connection.',
    };
  }
}

interface DatabaseSchemaInfo {
  titlePropertyKey: string;
  urlPropertyKey?: string;
}

async function getDatabaseSchemaInfo(
  dbId: string,
  headers: Record<string, string>
): Promise<DatabaseSchemaInfo> {
  try {
    const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${dbId}`, {
      method: 'GET',
      headers: {
        Authorization: headers.Authorization,
        'Notion-Version': headers['Notion-Version'],
      },
    });

    if (res.ok) {
      const data = await res.json();
      const props = data.properties || {};
      const keys = Object.keys(props);

      const titlePropertyKey =
        keys.find((k) => props[k].type === 'title') || 'Name';

      const urlPropertyKey =
        keys.find((k) => props[k].type === 'url') ||
        keys.find((k) => k.toLowerCase() === 'url' && props[k].type === 'url');

      return { titlePropertyKey, urlPropertyKey };
    }
  } catch {}

  return { titlePropertyKey: 'Name' };
}

export async function findExistingPageForUrl(
  dbId: string,
  headers: Record<string, string>,
  noteUrl: string,
  titleText: string,
  schemaInfo: DatabaseSchemaInfo
): Promise<string | null> {
  try {
    const filterProperty = schemaInfo.urlPropertyKey || schemaInfo.titlePropertyKey;
    const isUrlProp = Boolean(schemaInfo.urlPropertyKey);
    const filterValue = isUrlProp ? noteUrl : titleText;

    const queryUrl = `https://api.notion.com/v1/databases/${dbId}/query`;
    const res = await fetchWithRetry(queryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: filterProperty,
          [isUrlProp ? 'url' : 'title']: {
            equals: filterValue,
          },
        },
        page_size: 1,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].id;
      }
    }
  } catch {}
  return null;
}

export function createNoteCalloutBlock(note: StickleNote) {
  const formattedDate = new Date(note.createdAt).toLocaleString();
  const tagList =
    note.tags && note.tags.length > 0
      ? note.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')
      : '';

  const metaParts = [
    `📅 ${formattedDate}`,
    `Anchor: ${note.anchor.tier}`,
    tagList ? `Tags: ${tagList}` : '',
  ].filter(Boolean);

  return {
    object: 'block',
    type: 'callout',
    callout: {
      icon: { emoji: '📌' },
      rich_text: [
        {
          type: 'text',
          text: {
            content: note.content || '(Empty note content)',
          },
        },
        {
          type: 'text',
          text: {
            content: `\n\n${metaParts.join(' | ')}`,
          },
          annotations: {
            italic: true,
            color: 'gray',
          },
        },
      ],
    },
  };
}

export async function pushNoteToNotionDirect(
  note: StickleNote,
  config: NotionConfig,
  pageCache?: Map<string, string>
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

  const titleText = note.pageTitle || note.url;
  const schemaInfo = await getDatabaseSchemaInfo(dbId, headers);

  let targetPageId = note.syncedToNotion && note.notionPageId ? note.notionPageId : null;

  if (!targetPageId && pageCache?.has(note.url)) {
    targetPageId = pageCache.get(note.url) || null;
  }

  if (!targetPageId) {
    targetPageId = await findExistingPageForUrl(dbId, headers, note.url, titleText, schemaInfo);
  }

  const calloutBlock = createNoteCalloutBlock(note);

  if (targetPageId) {
    // Append callout block to existing master Notion page for this URL
    const appendBlocksUrl = `https://api.notion.com/v1/blocks/${targetPageId}/children`;
    const res = await fetchWithRetry(appendBlocksUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        children: [calloutBlock],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(formatNotionApiError(res, errJson));
    }

    if (pageCache) {
      pageCache.set(note.url, targetPageId);
    }

    await updateNote(note.id, {
      syncedToNotion: true,
      notionPageId: targetPageId,
      updatedAt: Date.now(),
    });

    return targetPageId;
  } else {
    // Create new master Notion page for this URL in database
    const createUrl = 'https://api.notion.com/v1/pages';
    const pageProperties: Record<string, any> = {
      [schemaInfo.titlePropertyKey]: {
        title: [{ text: { content: titleText } }],
      },
    };

    if (schemaInfo.urlPropertyKey) {
      pageProperties[schemaInfo.urlPropertyKey] = {
        url: note.url,
      };
    }

    const createBody = {
      parent: { database_id: dbId },
      properties: pageProperties,
      children: [calloutBlock],
    };

    const res = await fetchWithRetry(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(formatNotionApiError(res, errJson));
    }

    const responseData = await res.json();
    const notionPageId = responseData.id;

    if (pageCache) {
      pageCache.set(note.url, notionPageId);
    }

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
  const pageCache = new Map<string, string>();

  for (let i = 0; i < unsynced.length; i++) {
    try {
      await pushNoteToNotionDirect(unsynced[i], config, pageCache);
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

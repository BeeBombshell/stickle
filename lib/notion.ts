import type { StickleNote } from './types';

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export async function pushNoteToNotion(note: StickleNote, _config: NotionConfig): Promise<string> {
  // Stub for Phase 4 Notion integration
  console.log('[Stickle Notion] Pushing note to Notion:', note.id);
  return 'notion-page-id-placeholder';
}

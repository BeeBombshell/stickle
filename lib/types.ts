export type AnchorTier = 'selector' | 'text-fragment' | 'fuzzy' | 'unanchored';

export type NoteColorBlock = 'lime' | 'lilac' | 'cream' | 'mint' | 'pink' | 'coral' | 'navy';

export interface NoteAnchor {
  cssSelector: string;
  textPrefix?: string;
  textSuffix?: string;
  exactText?: string;
  offsetX: number;
  offsetY: number;
  tier: AnchorTier;
}

export interface StickleNote {
  id: string;
  url: string;
  pageTitle: string;
  content: string;
  anchor: NoteAnchor;
  createdAt: number;
  updatedAt: number;
  syncedToNotion: boolean;
  notionPageId?: string;
  color?: NoteColorBlock;
  collapsed?: boolean;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}



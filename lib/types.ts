export type AnchorTier = 'selector' | 'text-fragment' | 'fuzzy' | 'unanchored';

export type NoteColorBlock = 'lime' | 'lilac' | 'cream' | 'mint' | 'pink' | 'coral' | 'blue';

export type NoteBorderStyle = 'none' | 'dashed' | 'solid';

export interface NoteAnchor {
  cssSelector: string;
  textPrefix?: string;
  textSuffix?: string;
  exactText?: string;
  offsetX: number;
  offsetY: number;
  /** Absolute document X at time of creation (scroll-independent) */
  pageX?: number;
  /** Absolute document Y at time of creation (scroll-independent) */
  pageY?: number;
  /** Index of element among all same-tag elements in the document (e.g. 47th <p>) */
  domIndex?: number;
  /** Tag name of the anchor element (e.g. 'p', 'li', 'span') */
  domTag?: string;
  /** First 60 chars of element's normalized text — used to validate domIndex on restore */
  textFingerprint?: string;
  tier: AnchorTier;
}

export interface NoteHighlightRange {
  selectedText: string;
  startContainerPath: string;
  startOffset: number;
  endContainerPath: string;
  endOffset: number;
}

export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict';

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
  borderStyle?: NoteBorderStyle;
  collapsed?: boolean;
  highlightRange?: NoteHighlightRange;
  tags?: string[];
  // Cloud Sync & Multi-device fields
  syncStatus?: SyncStatus;
  cloudId?: string;
  userId?: string;
  workspaceId?: string;
  deletedAt?: number;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  tier: 'free' | 'supporter' | 'team_member';
  licenseKey?: string;
  avatarUrl?: string;
}




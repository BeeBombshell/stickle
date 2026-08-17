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
  /** Full/truncated snippet of webpage element text the note was attached to */
  anchoredText?: string;
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
  /** Snippet of webpage element text the note was anchored to (for LLM/MCP reference) */
  anchoredText?: string;
  // Cloud Sync & Multi-device fields
  syncStatus?: SyncStatus;
  cloudId?: string;
  userId?: string;
  workspaceId?: string;
  deletedAt?: number;
  // Team Workspace fields
  authorName?: string;
  authorAvatarUrl?: string;
  isReadOnly?: boolean;
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

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  memberCount?: number;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  email: string;
  avatarUrl?: string;
  joinedAt?: string;
}





export type NoteColorBlock = 'lime' | 'blue' | 'lilac' | 'cream' | 'mint' | 'pink' | 'coral' | 'navy';

export interface NoteAnchor {
  cssSelector: string;
  textPrefix?: string;
  textSuffix?: string;
  exactText?: string;
  offsetX: number;
  offsetY: number;
  tier: 'dom-index' | 'selector' | 'text-fragment' | 'fuzzy' | 'unanchored';
  domIndex?: number;
  textFingerprint?: string;
  pageX?: number;
  pageY?: number;
}

export interface DashboardNote {
  id: string;
  url: string;
  domain: string;
  page_title: string;
  content: string;
  anchor: NoteAnchor;
  color?: NoteColorBlock;
  border_style?: 'solid' | 'dashed' | 'none';
  collapsed?: boolean;
  tags?: string[];
  user_id?: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
  synced_to_notion?: boolean;
  notion_page_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  tier: 'free' | 'supporter' | 'team_member';
  license_key?: string;
  created_at: string;
}

export interface ApiKeyItem {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

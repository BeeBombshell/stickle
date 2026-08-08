export type FeatureFlag = 'cloudSync' | 'teamSharing' | 'remoteMCP' | 'centralDashboard';
export type UserTier = 'free' | 'supporter' | 'team_member';

const TIER_FLAGS: Record<UserTier, Record<FeatureFlag, boolean>> = {
  free: {
    cloudSync: false,
    teamSharing: false,
    remoteMCP: false,
    centralDashboard: false,
  },
  supporter: {
    cloudSync: true,
    teamSharing: false,
    remoteMCP: true,
    centralDashboard: true,
  },
  team_member: {
    cloudSync: true,
    teamSharing: true,
    remoteMCP: true,
    centralDashboard: true,
  },
};

export const isEnabled = (flag: FeatureFlag, tier: UserTier = 'free'): boolean => {
  return TIER_FLAGS[tier]?.[flag] ?? false;
};

export const FEATURE_NAMES: Record<FeatureFlag, { name: string; description: string; minTier: string }> = {
  cloudSync: {
    name: 'Cross-Device Cloud Sync',
    description: 'Sync your notes seamlessly across all your browsers and devices in real-time.',
    minTier: 'Pro Supporter',
  },
  teamSharing: {
    name: 'Team Workspace & Annotations',
    description: 'Share in-page web notes and see live team highlights directly on shared websites.',
    minTier: 'Teams',
  },
  remoteMCP: {
    name: 'Remote MCP Access (HTTPS/SSE)',
    description: 'Connect AI assistants (Claude, Cursor) to your cloud notes via HTTPS endpoints.',
    minTier: 'Pro Supporter',
  },
  centralDashboard: {
    name: 'Central Web Dashboard',
    description: 'Manage, search, and explore all web notes in a unified web application.',
    minTier: 'Pro Supporter',
  },
};

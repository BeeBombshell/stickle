import { useState } from 'preact/hooks';

interface DocArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  breadcrumbs: string[];
  toc: { id: string; label: string }[];
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
}

export default function DocsApp() {
  const [activeDocId, setActiveDocId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [packageManager, setPackageManager] = useState<'pnpm' | 'npm' | 'yarn' | 'bun'>('pnpm');
  const [mcpClientTab, setMcpClientTab] = useState<'cursor' | 'claude' | 'windsurf' | 'vscode'>('cursor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const navCategories = [
    {
      name: 'Getting Started',
      items: [
        { id: 'overview', title: 'Introduction' },
        { id: 'installation', title: 'Installation' },
        { id: 'quickstart', title: 'Quickstart Tutorial' },
      ],
    },
    {
      name: 'Guides & Features',
      items: [
        { id: 'annotating', title: 'Annotating the Web' },
        { id: 'styling-tags', title: 'Styling, Swatches & Tags' },
        { id: 'shortcuts', title: 'Keyboard Shortcuts' },
      ],
    },
    {
      name: 'Architecture',
      items: [
        { id: 'anchoring', title: '5-Tier Resilient Anchoring' },
      ],
    },
    {
      name: 'AI & MCP Server',
      items: [
        { id: 'mcp-overview', title: 'Model Context Protocol' },
        { id: 'mcp-clients', title: 'Cursor & Claude Setup' },
        { id: 'mcp-tools', title: 'MCP Tools API Reference' },
      ],
    },
    {
      name: 'Integrations',
      items: [
        { id: 'notion', title: 'Notion Database Sync' },
      ],
    },
    {
      name: 'Data & Privacy',
      items: [
        { id: 'backup-restore', title: 'JSON Backup & Portability' },
        { id: 'privacy', title: 'Privacy & Permissions' },
      ],
    },
    {
      name: 'Community & Code',
      items: [
        { id: 'contributing', title: 'Contributing Guide' },
        { id: 'issues-discussions', title: 'Issues & Discussions' },
      ],
    },
    {
      name: 'Help',
      items: [
        { id: 'faq', title: 'FAQ & Troubleshooting' },
      ],
    },
  ];

  // Map of article metadata
  const docArticles: Record<string, DocArticle> = {
    overview: {
      id: 'overview',
      category: 'Getting Started',
      title: 'Introduction to Stickle',
      description: 'Stickle is a local-first browser extension and developer tool for pinning persistent sticky notes directly onto DOM elements across the web.',
      breadcrumbs: ['Docs', 'Getting Started', 'Introduction'],
      toc: [
        { id: 'what-is-stickle', label: 'What is Stickle?' },
        { id: 'core-philosophy', label: 'Core Philosophy' },
        { id: 'key-features', label: 'Key Features' },
        { id: 'next-steps', label: 'Next Steps' },
      ],
      next: { id: 'installation', title: 'Installation' },
    },
    installation: {
      id: 'installation',
      category: 'Getting Started',
      title: 'Installation',
      description: 'How to install the Stickle extension in Google Chrome from source or via developer mode.',
      breadcrumbs: ['Docs', 'Getting Started', 'Installation'],
      toc: [
        { id: 'from-source', label: 'Building from Source' },
        { id: 'developer-mode', label: 'Loading Unpacked Extension' },
        { id: 'permissions', label: 'Required Permissions' },
      ],
      prev: { id: 'overview', title: 'Introduction' },
      next: { id: 'quickstart', title: 'Quickstart Tutorial' },
    },
    quickstart: {
      id: 'quickstart',
      category: 'Getting Started',
      title: 'Quickstart Tutorial',
      description: 'Pin your very first sticky note in under 10 seconds and explore the core workflow.',
      breadcrumbs: ['Docs', 'Getting Started', 'Quickstart Tutorial'],
      toc: [
        { id: 'step-1', label: '1. Navigate to Any Webpage' },
        { id: 'step-2', label: '2. Drop a Sticky Note (Alt + Click)' },
        { id: 'step-3', label: '3. Personalize & Tag' },
        { id: 'step-4', label: '4. View in Popup Manager' },
      ],
      prev: { id: 'installation', title: 'Installation' },
      next: { id: 'annotating', title: 'Annotating the Web' },
    },
    annotating: {
      id: 'annotating',
      category: 'Guides & Features',
      title: 'Annotating the Web',
      description: 'Comprehensive guide to dropping notes on DOM elements, highlighting text fragments, and repositioning bubbles.',
      breadcrumbs: ['Docs', 'Guides & Features', 'Annotating the Web'],
      toc: [
        { id: 'alt-click', label: 'Alt + Click Placement' },
        { id: 'selection-pill', label: 'Text Selection Action Pill' },
        { id: 'drag-and-drop', label: 'Dragging & Repositioning' },
        { id: 'collapsible-mode', label: 'Collapsible Note Pills' },
      ],
      prev: { id: 'quickstart', title: 'Quickstart Tutorial' },
      next: { id: 'styling-tags', title: 'Styling, Swatches & Tags' },
    },
    'styling-tags': {
      id: 'styling-tags',
      category: 'Guides & Features',
      title: 'Styling, Swatches & Tags',
      description: 'Customize note aesthetics with 7 pastel swatches, border styles, and hashtag categorization.',
      breadcrumbs: ['Docs', 'Guides & Features', 'Styling, Swatches & Tags'],
      toc: [
        { id: 'color-swatches', label: 'Pastel Color Palette' },
        { id: 'border-styles', label: 'Border Styles (Solid / Dashed / None)' },
        { id: 'hashtag-system', label: 'Automatic Hashtag Indexing' },
      ],
      prev: { id: 'annotating', title: 'Annotating the Web' },
      next: { id: 'shortcuts', title: 'Keyboard Shortcuts' },
    },
    shortcuts: {
      id: 'shortcuts',
      category: 'Guides & Features',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your annotation workflow with built-in hotkeys and gestures.',
      breadcrumbs: ['Docs', 'Guides & Features', 'Keyboard Shortcuts'],
      toc: [
        { id: 'shortcut-table', label: 'Shortcut Reference Table' },
        { id: 'custom-bindings', label: 'Browser Shortcut Configuration' },
      ],
      prev: { id: 'styling-tags', title: 'Styling, Swatches & Tags' },
      next: { id: 'anchoring', title: '5-Tier Resilient Anchoring' },
    },
    anchoring: {
      id: 'anchoring',
      category: 'Architecture',
      title: '5-Tier Resilient DOM Anchoring',
      description: 'Technical deep-dive into how Stickle anchors sticky notes across React re-renders, A/B tests, and dynamic DOM shifts.',
      breadcrumbs: ['Docs', 'Architecture', '5-Tier Resilient Anchoring'],
      toc: [
        { id: 'the-problem', label: 'The Note Drift Problem' },
        { id: 'tier-1', label: 'Tier 1: Precise CSS Selector & Offset' },
        { id: 'tier-2', label: 'Tier 2: W3C Text Fragment & Range' },
        { id: 'tier-3', label: 'Tier 3: Semantic XPath & Hierarchy' },
        { id: 'tier-4', label: 'Tier 4: Fuzzy Text Matching (Levenshtein)' },
        { id: 'tier-5', label: 'Tier 5: Viewport Recovery & Drawer' },
      ],
      prev: { id: 'shortcuts', title: 'Keyboard Shortcuts' },
      next: { id: 'mcp-overview', title: 'Model Context Protocol' },
    },
    'mcp-overview': {
      id: 'mcp-overview',
      category: 'AI & MCP Server',
      title: 'Model Context Protocol (MCP)',
      description: 'Expose all your web research, bookmarks, and pinned annotations to AI coding agents and LLMs.',
      breadcrumbs: ['Docs', 'AI & MCP Server', 'Overview'],
      toc: [
        { id: 'what-is-mcp', label: 'What is MCP?' },
        { id: 'architecture', label: 'How It Works' },
        { id: 'export-notes', label: 'Step 0 — Export Notes First' },
        { id: 'github-repo', label: 'GitHub Repository' },
      ],
      prev: { id: 'anchoring', title: '5-Tier Resilient Anchoring' },
      next: { id: 'mcp-clients', title: 'Client Setup' },
    },
    'mcp-clients': {
      id: 'mcp-clients',
      category: 'AI & MCP Server',
      title: 'Client Setup (Cursor, Claude, VS Code, Windsurf)',
      description: 'Step-by-step configuration for Cursor, Claude Desktop, VS Code Copilot, and Windsurf.',
      breadcrumbs: ['Docs', 'AI & MCP Server', 'Client Configuration'],
      toc: [
        { id: 'step1-clone', label: 'Step 1 — Clone & Install' },
        { id: 'step2-client', label: 'Step 2 — Pick Your Client' },
        { id: 'step3-verify', label: 'Step 3 — Verify Connection' },
      ],
      prev: { id: 'mcp-overview', title: 'Model Context Protocol' },
      next: { id: 'mcp-tools', title: 'MCP Tools Reference' },
    },
    'mcp-tools': {
      id: 'mcp-tools',
      category: 'AI & MCP Server',
      title: 'MCP Tools API Reference',
      description: 'Complete schema reference for all 5 tools in the Stickle local MCP server.',
      breadcrumbs: ['Docs', 'AI & MCP Server', 'Tools Reference'],
      toc: [
        { id: 'list_stickle_notes', label: 'list_stickle_notes' },
        { id: 'search_stickle_notes', label: 'search_stickle_notes' },
        { id: 'get_notes_for_url', label: 'get_notes_for_url' },
        { id: 'add_stickle_note', label: 'add_stickle_note' },
        { id: 'export_stickle_summary', label: 'export_stickle_summary' },
      ],
      prev: { id: 'mcp-clients', title: 'Client Setup' },
      next: { id: 'notion', title: 'Notion Database Sync' },
    },
    notion: {
      id: 'notion',
      category: 'Integrations',
      title: 'Notion Database Sync',
      description: 'Sync web sticky notes to your personal Notion workspace in 1 click using private integration tokens.',
      breadcrumbs: ['Docs', 'Integrations', 'Notion Database Sync'],
      toc: [
        { id: 'create-integration', label: '1. Create Internal Integration' },
        { id: 'connect-database', label: '2. Connect Database' },
        { id: 'configure-extension', label: '3. Configure Stickle Settings' },
        { id: 'sync-workflow', label: '4. 1-Click Sync in Action' },
      ],
      prev: { id: 'mcp-tools', title: 'MCP Tools API Reference' },
      next: { id: 'backup-restore', title: 'JSON Backup & Portability' },
    },
    'backup-restore': {
      id: 'backup-restore',
      category: 'Data & Privacy',
      title: 'JSON Backup & Data Portability',
      description: 'Export all your notes to standard JSON backups and restore them across different machines or browsers.',
      breadcrumbs: ['Docs', 'Data & Privacy', 'Backup & Restore'],
      toc: [
        { id: 'export-backup', label: 'Exporting Backup (.json)' },
        { id: 'import-backup', label: 'Restoring & Deduplicating' },
        { id: 'json-schema', label: 'Stickle JSON Schema' },
      ],
      prev: { id: 'notion', title: 'Notion Database Sync' },
      next: { id: 'privacy', title: 'Privacy & Permissions' },
    },
    privacy: {
      id: 'privacy',
      category: 'Data & Privacy',
      title: 'Privacy & Local Storage Model',
      description: 'Stickle is built on a zero-telemetry, offline-first architecture. Your notes never leave your computer.',
      breadcrumbs: ['Docs', 'Data & Privacy', 'Privacy & Permissions'],
      toc: [
        { id: 'local-first-principle', label: 'Local-First Principle' },
        { id: 'storage-engine', label: 'IndexedDB Storage Engine' },
        { id: 'permissions-explained', label: 'Chrome Permissions Audit' },
      ],
      prev: { id: 'backup-restore', title: 'JSON Backup & Portability' },
      next: { id: 'contributing', title: 'Contributing Guide' },
    },
    contributing: {
      id: 'contributing',
      category: 'Community & Code',
      title: 'Contributing to Stickle',
      description: 'How to contribute bug reports, feature requests, documentation, and pull requests to the open-source repository.',
      breadcrumbs: ['Docs', 'Community & Code', 'Contributing Guide'],
      toc: [
        { id: 'codebase-structure', label: 'Repository & Architecture' },
        { id: 'local-development', label: 'Local Development Setup' },
        { id: 'running-tests', label: 'Running Tests (Vitest)' },
        { id: 'submitting-prs', label: 'Submitting Pull Requests' },
      ],
      prev: { id: 'privacy', title: 'Privacy & Permissions' },
      next: { id: 'issues-discussions', title: 'Issues & Discussions' },
    },
    'issues-discussions': {
      id: 'issues-discussions',
      category: 'Community & Code',
      title: 'Issues, Bugs & Discussions',
      description: 'Join the Stickle community on GitHub to report issues, suggest ideas, and discuss architectural RFCs.',
      breadcrumbs: ['Docs', 'Community & Code', 'Issues & Discussions'],
      toc: [
        { id: 'reporting-bugs', label: 'Reporting Bugs & Regressions' },
        { id: 'feature-requests', label: 'Feature Suggestions & RFCs' },
        { id: 'github-links', label: 'Official GitHub Links' },
      ],
      prev: { id: 'contributing', title: 'Contributing Guide' },
      next: { id: 'faq', title: 'FAQ & Troubleshooting' },
    },
    faq: {
      id: 'faq',
      category: 'Help',
      title: 'FAQ & Troubleshooting',
      description: 'Answers to frequently asked questions about SPAs, React re-renders, offline modes, and shortcut conflicts.',
      breadcrumbs: ['Docs', 'Help', 'FAQ & Troubleshooting'],
      toc: [
        { id: 'faq-reloads', label: 'Do notes persist across browser restarts?' },
        { id: 'faq-spas', label: 'How does Stickle handle dynamic SPAs?' },
        { id: 'faq-offline', label: 'Does Stickle require internet access?' },
        { id: 'faq-ai', label: 'How do AI assistants query my notes?' },
      ],
      prev: { id: 'issues-discussions', title: 'Issues & Discussions' },
    },
  };

  const currentDoc = docArticles[activeDocId] || docArticles['overview'];

  const getInstallSnippet = (pm: 'pnpm' | 'npm' | 'yarn' | 'bun') => {
    switch (pm) {
      case 'pnpm':
        return `git clone https://github.com/BeeBombshell/stickle.git\ncd stickle\npnpm install\npnpm build`;
      case 'npm':
        return `git clone https://github.com/BeeBombshell/stickle.git\ncd stickle\nnpm install\nnpm run build`;
      case 'yarn':
        return `git clone https://github.com/BeeBombshell/stickle.git\ncd stickle\nyarn install\nyarn build`;
      case 'bun':
        return `git clone https://github.com/BeeBombshell/stickle.git\ncd stickle\nbun install\nbun run build`;
    }
  };

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'pnpm',
          args: ['--prefix', '/absolute/path/to/stickle', 'mcp'],
          env: { STICKLE_NOTES_PATH: '/Users/yourname/.stickle/notes.json' },
        },
      },
    },
    null,
    2
  );

  const claudeJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'pnpm',
          args: ['--prefix', '/absolute/path/to/stickle', 'mcp'],
          env: { STICKLE_NOTES_PATH: '/Users/yourname/.stickle/notes.json' },
        },
      },
    },
    null,
    2
  );

  const windsurfJson = JSON.stringify(
    {
      mcpServers: {
        stickle: {
          command: 'pnpm',
          args: ['--prefix', '/absolute/path/to/stickle', 'mcp'],
          env: { STICKLE_NOTES_PATH: '/Users/yourname/.stickle/notes.json' },
        },
      },
    },
    null,
    2
  );

  const vscodeJson = JSON.stringify(
    {
      'github.copilot.chat.mcp.servers': {
        stickle: {
          command: 'pnpm',
          args: ['--prefix', '/absolute/path/to/stickle', 'mcp'],
          env: { STICKLE_NOTES_PATH: '/Users/yourname/.stickle/notes.json' },
        },
      },
    },
    null,
    2
  );

  const filteredCategories = navCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        searchQuery.trim() === ''
          ? true
          : item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div style={nextStyles.wrapper}>
      {/* ── 1. NEXT.JS STYLE TOP NAVBAR ────────────────────────────────────────── */}
      <header style={nextStyles.header}>
        <div style={nextStyles.headerInner}>
          <div style={nextStyles.headerLeft}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={nextStyles.mobileMenuBtn}
              aria-label="Toggle Navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <button
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
                } else {
                  window.location.href = '/';
                }
              }}
              style={{ ...nextStyles.logoLockup, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={nextStyles.logoMark}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="13" cy="13" r="5" fill="white" opacity="0.9" />
                  <circle cx="13" cy="13" r="2" fill="#111" />
                </svg>
              </div>
              <span style={nextStyles.logoText}>Stickle</span>
              <span style={nextStyles.docsSlash}>/</span>
              <span style={nextStyles.docsLabel}>docs</span>
              <span style={nextStyles.versionPill}>v1.0</span>
            </button>
          </div>

          <div style={nextStyles.headerCenter}>
            <div style={nextStyles.searchBar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                style={nextStyles.searchInput}
              />
              <kbd style={nextStyles.searchKbd}>⌘K</kbd>
            </div>
          </div>

          <div style={nextStyles.headerRight}>
            <nav style={nextStyles.topNavLinks}>
              <button
                onClick={() => setActiveDocId('overview')}
                style={activeDocId === 'overview' ? nextStyles.topNavLinkActive : nextStyles.topNavLink}
              >
                Docs
              </button>
              <button
                onClick={() => setActiveDocId('mcp-overview')}
                style={activeDocId.startsWith('mcp') ? nextStyles.topNavLinkActive : nextStyles.topNavLink}
              >
                Local MCP
              </button>
              <button
                onClick={() => setActiveDocId('contributing')}
                style={activeDocId === 'contributing' ? nextStyles.topNavLinkActive : nextStyles.topNavLink}
              >
                Contributing
              </button>
              <button
                onClick={() => {
                  if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
                  } else {
                    window.open('/onboarding', '_blank');
                  }
                }}
                style={nextStyles.topNavLink}
              >
                Sandbox ↗
              </button>
            </nav>

            <div style={nextStyles.divider} />

            <a
              href="https://github.com/BeeBombshell/stickle"
              target="_blank"
              rel="noreferrer"
              style={nextStyles.githubStarBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. THREE-COLUMN DOCS LAYOUT ────────────────────────────────────────── */}
      <div className="docs-main-grid" style={nextStyles.mainGrid}>
        {/* ── LEFT SIDEBAR NAVIGATION ────────────────────────────────────────── */}
        <aside
          className={`docs-sidebar-col ${mobileMenuOpen ? 'mobile-open' : ''}`}
          style={nextStyles.sidebar}
        >
          <div style={nextStyles.sidebarInner}>
            {filteredCategories.map((group) => (
              <div key={group.name} style={nextStyles.navGroup}>
                <h4 style={nextStyles.navGroupTitle}>{group.name}</h4>
                <div style={nextStyles.navGroupList}>
                  {group.items.map((item) => {
                    const active = activeDocId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveDocId(item.id);
                          setMobileMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={active ? nextStyles.navItemActive : nextStyles.navItem}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={nextStyles.sidebarFooterLinks}>
              <div style={nextStyles.navGroupTitle}>COMMUNITY & CODE</div>
              <a
                href="https://github.com/BeeBombshell/stickle"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.extLink}
              >
                <span>GitHub Repo</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <a
                href="https://github.com/BeeBombshell/stickle/issues"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.extLink}
              >
                <span>Issue Tracker</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <a
                href="https://github.com/BeeBombshell/stickle/discussions"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.extLink}
              >
                <span>Discussions</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </aside>

        {/* ── CENTER DOCUMENTATION ARTICLE ──────────────────────────────────── */}
        <main className="docs-content-area" style={nextStyles.contentArea}>
          <div style={nextStyles.articleWrap}>
            {/* Breadcrumb row */}
            <div style={nextStyles.breadcrumbRow}>
              {currentDoc.breadcrumbs.map((b, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: '#a1a1aa' }}>/</span>}
                  <span style={{ color: i === currentDoc.breadcrumbs.length - 1 ? '#09090b' : '#71717a', fontWeight: i === currentDoc.breadcrumbs.length - 1 ? 500 : 400 }}>
                    {b}
                  </span>
                </span>
              ))}
            </div>

            {/* Doc Header */}
            <div style={{ marginBottom: 32 }}>
              <div style={nextStyles.categoryPill}>{currentDoc.category}</div>
              <h1 style={nextStyles.docH1}>{currentDoc.title}</h1>
              <p style={nextStyles.docSubhead}>{currentDoc.description}</p>
            </div>

            {/* ══ ARTICLE CONTENT ROUTING ════════════════════════════════════ */}
            {activeDocId === 'overview' && (
              <div>
                <div style={nextStyles.calloutNote}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>Local-First Core Philosophy</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    Stickle operates entirely on your device with <strong>IndexedDB</strong>. No user accounts, no cloud servers, and zero telemetry tracking your note contents or browsing history.
                  </p>
                </div>

                <h2 id="what-is-stickle" style={nextStyles.docH2}>What is Stickle?</h2>
                <p style={nextStyles.paragraph}>
                  Stickle allows knowledge workers, software engineers, and researchers to treat the entire World Wide Web as an editable canvas. By holding <kbd style={nextStyles.kbd}>Alt</kbd> and clicking any DOM element, you attach a high-contrast sticky note that stays pinned to that exact coordinate even through page reloads, React component re-renders, and responsive layout shifts.
                </p>

                <h2 id="core-philosophy" style={nextStyles.docH2}>Core Philosophy</h2>
                <div style={nextStyles.cardGrid}>
                  <div style={nextStyles.docCard}>
                    <div style={nextStyles.cardIconWrap}>⚡️</div>
                    <h3 style={nextStyles.cardH3}>Zero Friction</h3>
                    <p style={nextStyles.cardP}>No login wall, no subscription, no wait. Install the extension and start dropping stickles immediately.</p>
                  </div>
                  <div style={nextStyles.docCard}>
                    <div style={nextStyles.cardIconWrap}>🔒</div>
                    <h3 style={nextStyles.cardH3}>Privacy by Design</h3>
                    <p style={nextStyles.cardP}>100% of your notes remain in your local browser storage. We never collect or read your annotations.</p>
                  </div>
                  <div style={nextStyles.docCard}>
                    <div style={nextStyles.cardIconWrap}>🤖</div>
                    <h3 style={nextStyles.cardH3}>AI &amp; MCP Native</h3>
                    <p style={nextStyles.cardP}>Native Model Context Protocol (MCP) server allows Claude Desktop &amp; Cursor to query and create web notes.</p>
                  </div>
                  <div style={nextStyles.docCard}>
                    <div style={nextStyles.cardIconWrap}>🔀</div>
                    <h3 style={nextStyles.cardH3}>5-Tier Resilient Engine</h3>
                    <p style={nextStyles.cardP}>W3C text fragments, semantic XPath, and Levenshtein fuzzy matching prevent notes from drifting on dynamic SPAs.</p>
                  </div>
                </div>

                <h2 id="next-steps" style={nextStyles.docH2}>Next Steps</h2>
                <p style={nextStyles.paragraph}>
                  Get started by following the installation guide to load the extension into your Chrome browser.
                </p>
              </div>
            )}

            {activeDocId === 'installation' && (
              <div>
                <h2 id="from-source" style={nextStyles.docH2}>Building from Source</h2>
                <p style={nextStyles.paragraph}>
                  Stickle is built with TypeScript, Preact, Vite, and WXT. You can clone and build the extension locally in seconds:
                </p>

                {/* Package Manager Tabs */}
                <div style={nextStyles.codeTabWrap}>
                  <div style={nextStyles.tabHeader}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['pnpm', 'npm', 'yarn', 'bun'] as const).map((pm) => (
                        <button
                          key={pm}
                          onClick={() => setPackageManager(pm)}
                          style={packageManager === pm ? nextStyles.tabBtnActive : nextStyles.tabBtn}
                        >
                          {pm}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => copyCode(getInstallSnippet(packageManager), 'install')}
                      style={nextStyles.copyButton}
                    >
                      {copiedKey === 'install' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre style={nextStyles.codeBlock}>{getInstallSnippet(packageManager)}</pre>
                </div>

                <h2 id="developer-mode" style={nextStyles.docH2}>Loading Unpacked Extension</h2>
                <ol style={nextStyles.orderedList}>
                  <li>Open Google Chrome and navigate to <code style={nextStyles.inlineCode}>chrome://extensions</code></li>
                  <li>Toggle the <strong>Developer mode</strong> switch in the top right corner.</li>
                  <li>Click the <strong>Load unpacked</strong> button in the sub-header.</li>
                  <li>Select the <code style={nextStyles.inlineCode}>.output/chrome-mv3</code> folder inside your cloned repository directory.</li>
                </ol>

                <div style={nextStyles.calloutTip}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>Live Reloading with WXT</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    During development, run <code style={nextStyles.inlineCode}>pnpm dev</code>. WXT automatically rebuilds content scripts and UI pages with hot module replacement (HMR).
                  </p>
                </div>

                <h2 id="permissions" style={nextStyles.docH2}>Required Permissions</h2>
                <p style={nextStyles.paragraph}>
                  Stickle uses standard Manifest V3 permissions:
                </p>
                <ul style={nextStyles.bulletList}>
                  <li><code style={nextStyles.inlineCode}>storage</code>: Saves user preferences and Notion database credentials locally.</li>
                  <li><code style={nextStyles.inlineCode}>activeTab</code>: Enables keyboard shortcut listening and DOM coordinate calculations.</li>
                </ul>
              </div>
            )}

            {activeDocId === 'quickstart' && (
              <div>
                <h2 id="step-1" style={nextStyles.docH2}>1. Navigate to Any Webpage</h2>
                <p style={nextStyles.paragraph}>
                  Open any website: Wikipedia, GitHub documentation, Stripe API references, or a news article.
                </p>

                <h2 id="step-2" style={nextStyles.docH2}>2. Drop a Sticky Note (Alt + Click)</h2>
                <p style={nextStyles.paragraph}>
                  Hold down the <kbd style={nextStyles.kbd}>Alt</kbd> key (or <kbd style={nextStyles.kbd}>Option ⌥</kbd> on macOS) and click on any paragraph, heading, or code element. An interactive sticky note bubble will appear anchored right beside the target.
                </p>

                <h2 id="step-3" style={nextStyles.docH2}>3. Personalize &amp; Tag</h2>
                <p style={nextStyles.paragraph}>
                  Type your markdown notes or thoughts. Add tags like <code style={nextStyles.inlineCode}>#research</code> or <code style={nextStyles.inlineCode}>#bug</code> directly inside the text to automatically index notes for quick querying.
                </p>

                <h2 id="step-4" style={nextStyles.docH2}>4. View in Popup Manager</h2>
                <p style={nextStyles.paragraph}>
                  Click the Stickle extension icon in your Chrome toolbar to view the central popup manager, search across all anchored notes on the current domain, or export backups.
                </p>
              </div>
            )}

            {activeDocId === 'annotating' && (
              <div>
                <h2 id="alt-click" style={nextStyles.docH2}>Alt + Click Placement</h2>
                <p style={nextStyles.paragraph}>
                  Holding <kbd style={nextStyles.kbd}>Alt</kbd> activates the Stickle spatial anchor tool. The hovered DOM element receives a subtle indicator border. Clicking creates a note attached to that node's bounding rectangle.
                </p>

                <h2 id="selection-pill" style={nextStyles.docH2}>Text Selection Action Pill</h2>
                <p style={nextStyles.paragraph}>
                  When you highlight any text quote on a webpage, a floating <strong>"⚡ Stickle"</strong> action pill appears above your cursor. Clicking it generates an annotated quote with W3C Text Fragment range anchors.
                </p>

                <h2 id="drag-and-drop" style={nextStyles.docH2}>Dragging &amp; Repositioning</h2>
                <p style={nextStyles.paragraph}>
                  Click and hold the header drag handle of any note bubble to move it around. Stickle computes the relative <code style={nextStyles.inlineCode}>offsetX</code> and <code style={nextStyles.inlineCode}>offsetY</code> from the anchor element so the note stays perfectly positioned relative to its target.
                </p>

                <h2 id="collapsible-mode" style={nextStyles.docH2}>Collapsible Note Pills</h2>
                <p style={nextStyles.paragraph}>
                  Click the minimize chevron on any note header to collapse it into a compact pill badge. Hovering or clicking expands the note back to its full editor view.
                </p>
              </div>
            )}

            {activeDocId === 'styling-tags' && (
              <div>
                <h2 id="color-swatches" style={nextStyles.docH2}>Pastel Color Palette</h2>
                <p style={nextStyles.paragraph}>
                  Choose from 7 curated pastel swatches designed to stand out cleanly against light and dark web pages:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '16px 0 24px' }}>
                  {[
                    { name: 'Lime', hex: '#e4f579', border: '#d4ee42' },
                    { name: 'Lilac', hex: '#e8d5ff', border: '#d0b0ff' },
                    { name: 'Cream', hex: '#fff7db', border: '#ffe89e' },
                    { name: 'Mint', hex: '#d1f7c4', border: '#a3e88d' },
                    { name: 'Pink', hex: '#ffd6e8', border: '#ffb3d5' },
                    { name: 'Coral', hex: '#ffdbcc', border: '#ffbfa6' },
                    { name: 'Sky Blue', hex: '#bfdbfe', border: '#93c5fd' },
                  ].map((c) => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#fafafa' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: c.hex, border: `1px solid ${c.border}` }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a' }}>{c.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <h2 id="border-styles" style={nextStyles.docH2}>Border Styles</h2>
                <p style={nextStyles.paragraph}>
                  Toggle between <code style={nextStyles.inlineCode}>solid</code> (default), <code style={nextStyles.inlineCode}>dashed</code> (great for draft notes), and <code style={nextStyles.inlineCode}>none</code>.
                </p>

                <h2 id="hashtag-system" style={nextStyles.docH2}>Automatic Hashtag Indexing</h2>
                <p style={nextStyles.paragraph}>
                  Whenever you write <code style={nextStyles.inlineCode}>#tagname</code> anywhere inside a note, Stickle extracts and indexes the tag in IndexedDB. You can filter notes by tags in the popup or search them via the local MCP server.
                </p>
              </div>
            )}

            {activeDocId === 'shortcuts' && (
              <div>
                <h2 id="shortcut-table" style={nextStyles.docH2}>Shortcut Reference Table</h2>
                <div style={{ overflowX: 'auto', margin: '20px 0' }}>
                  <table style={nextStyles.table}>
                    <thead>
                      <tr>
                        <th style={nextStyles.th}>Shortcut</th>
                        <th style={nextStyles.th}>Action</th>
                        <th style={nextStyles.th}>Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={nextStyles.td}><kbd style={nextStyles.kbd}>Alt + Click</kbd></td>
                        <td style={nextStyles.td}>Create sticky note on clicked element</td>
                        <td style={nextStyles.td}>Any webpage</td>
                      </tr>
                      <tr>
                        <td style={nextStyles.td}><kbd style={nextStyles.kbd}>Option ⌥ + Click</kbd></td>
                        <td style={nextStyles.td}>Create sticky note on clicked element (macOS)</td>
                        <td style={nextStyles.td}>macOS browsers</td>
                      </tr>
                      <tr>
                        <td style={nextStyles.td}><kbd style={nextStyles.kbd}>Cmd / Ctrl + Enter</kbd></td>
                        <td style={nextStyles.td}>Save note and blur editor</td>
                        <td style={nextStyles.td}>Inside note textarea</td>
                      </tr>
                      <tr>
                        <td style={nextStyles.td}><kbd style={nextStyles.kbd}>Escape</kbd></td>
                        <td style={nextStyles.td}>Close note editor or clear focus</td>
                        <td style={nextStyles.td}>Active note</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeDocId === 'anchoring' && (
              <div>
                <h2 id="the-problem" style={nextStyles.docH2}>The Note Drift Problem</h2>
                <p style={nextStyles.paragraph}>
                  Webpages are not static paper. Modern SPAs re-render components, randomize CSS classes, change layouts on mobile, and update text content. To prevent notes from getting orphaned, Stickle implements a 5-tier resilient anchoring cascade.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}>
                  <div style={nextStyles.tierCard}>
                    <div style={nextStyles.tierBadge}>TIER 1 • 100% PRECISION</div>
                    <h3 style={nextStyles.tierTitle}>Tier 1: Precise CSS Selector &amp; Bounding Bounds</h3>
                    <p style={nextStyles.tierDesc}>Traverses the DOM tree to construct an unambiguous CSS path. Computes fractional offset percentages for pixel-perfect alignment.</p>
                  </div>

                  <div style={nextStyles.tierCard}>
                    <div style={nextStyles.tierBadge}>TIER 2 • W3C STANDARD</div>
                    <h3 style={nextStyles.tierTitle}>Tier 2: W3C Text Fragment &amp; Range Anchoring</h3>
                    <p style={nextStyles.tierDesc}>Complies with the W3C Web Annotation data model (prefix, exact quote, suffix). Anchors survive dynamic React node re-creation if text remains unchanged.</p>
                  </div>

                  <div style={nextStyles.tierCard}>
                    <div style={nextStyles.tierBadge}>TIER 3 • SEMANTIC HIERARCHY</div>
                    <h3 style={nextStyles.tierTitle}>Tier 3: Semantic XPath &amp; Tree Traversal</h3>
                    <p style={nextStyles.tierDesc}>Resolves hierarchical positions when CSS class names are obfuscated or regenerated by CSS-in-JS compilers (Emotion, styled-components).</p>
                  </div>

                  <div style={nextStyles.tierCard}>
                    <div style={nextStyles.tierBadge}>TIER 4 • FUZZY RESILIENCE</div>
                    <h3 style={nextStyles.tierTitle}>Tier 4: Fuzzy Text Matching (Levenshtein Distance)</h3>
                    <p style={nextStyles.tierDesc}>Finds the closest semantic paragraph match even if words or typos have been modified by page editors.</p>
                  </div>

                  <div style={nextStyles.tierCard}>
                    <div style={nextStyles.tierBadge}>TIER 5 • ZERO DATA LOSS</div>
                    <h3 style={nextStyles.tierTitle}>Tier 5: Viewport Fallback &amp; Unanchored Drawer</h3>
                    <p style={nextStyles.tierDesc}>If an anchored element was completely deleted from the page, the note floats cleanly in the sidebar drawer so you never lose research.</p>
                  </div>
                </div>
              </div>
            )}

            {activeDocId === 'mcp-overview' && (
              <div>
                <h2 id="what-is-mcp" style={nextStyles.docH2}>What is MCP?</h2>
                <p style={nextStyles.paragraph}>
                  The <strong>Model Context Protocol (MCP)</strong> is an open standard that lets AI assistants — Claude Desktop, Cursor, VS Code Copilot, Windsurf — call external tools and read structured data. Stickle exposes your browser annotations as 5 MCP tools so your AI coding agent can query, search, and create web notes directly.
                </p>

                <h2 id="architecture" style={nextStyles.docH2}>How It Works</h2>
                <p style={nextStyles.paragraph}>
                  The local MCP server runs as a child process spawned by your AI client over <code style={nextStyles.inlineCode}>stdio</code>. It reads from a plain JSON file (<code style={nextStyles.inlineCode}>~/.stickle/notes.json</code>) — no internet, no cloud, fully private.
                </p>
                <pre style={{ ...nextStyles.codeBlock, fontSize: 11, lineHeight: 1.6 }}>{`AI Client (Claude/Cursor)
        │  spawns
        ▼
Stickle MCP Server  ──reads──►  ~/.stickle/notes.json
                                        ▲
                              JSON export from
                              Chrome Extension`}</pre>

                <h2 id="export-notes" style={nextStyles.docH2}>Step 0 — Export Your Notes First</h2>
                <div style={nextStyles.calloutNote}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>You must do this before the MCP server can see any notes</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    The local MCP server reads from <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>~/.stickle/notes.json</code>. The Chrome extension stores notes in IndexedDB — you need to export a copy so the server can read it.
                  </p>
                </div>
                <ol style={nextStyles.orderedList}>
                  <li>Click the <strong>Stickle icon</strong> in your Chrome toolbar.</li>
                  <li>Go to <strong>Settings → Export / Backup</strong>.</li>
                  <li>Click <strong>"Export JSON"</strong> — downloads <code style={nextStyles.inlineCode}>stickle_export_YYYY-MM-DD.json</code>.</li>
                  <li>Move it to the default location:</li>
                </ol>
                <pre style={nextStyles.codeBlock}>{`mkdir -p ~/.stickle
cp ~/Downloads/stickle_export_*.json ~/.stickle/notes.json`}</pre>
                <p style={nextStyles.paragraph}>
                  Re-export whenever you add new notes. The server always reads the file fresh on every tool call.
                </p>

                <div style={nextStyles.calloutTip}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>Remote MCP — Coming Soon</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    A cloud-hosted MCP server (zero export required, real-time sync, team sharing) is in development. The local MCP is and will always remain free and open source.
                  </p>
                </div>

                <h2 id="github-repo" style={nextStyles.docH2}>Open Source Repository</h2>
                <p style={nextStyles.paragraph}>
                  The MCP server source is fully open. Read the code, fork it, or contribute:
                  {' '}<a href="https://github.com/BeeBombshell/stickle/tree/main/mcp-server" target="_blank" rel="noreferrer" style={{ color: '#09090b', fontWeight: 600 }}>stickle/mcp-server on GitHub ↗</a>
                </p>
              </div>
            )}

            {activeDocId === 'mcp-clients' && (
              <div>
                <h2 id="step1-clone" style={nextStyles.docH2}>Step 1 — Clone the repo &amp; install</h2>
                <p style={nextStyles.paragraph}>
                  The MCP server lives inside the Stickle repo. Clone it once and it's ready to run:
                </p>
                <pre style={nextStyles.codeBlock}>{`git clone https://github.com/BeeBombshell/stickle.git
cd stickle
pnpm install

# Verify it starts correctly (Ctrl+C to exit)
pnpm mcp
# → Stickle MCP Server running on stdio`}</pre>

                <div style={nextStyles.calloutNote}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Did you export your notes yet?</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    If you skipped Step 0, do that first — the server will start but return 0 notes until <code style={{ fontFamily: 'monospace' }}>~/.stickle/notes.json</code> exists.
                    See the <button onClick={() => setActiveDocId('mcp-overview')} style={{ background: 'none', border: 'none', color: '#09090b', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Overview → Step 0</button> section.
                  </p>
                </div>

                <h2 id="step2-client" style={nextStyles.docH2}>Step 2 — Configure your AI client</h2>
                <p style={nextStyles.paragraph}>
                  Paste the config into your client's MCP settings file. Replace <code style={nextStyles.inlineCode}>/absolute/path/to/stickle</code> with the actual path where you cloned the repo, and update <code style={nextStyles.inlineCode}>yourname</code>.
                </p>

                {/* Client selector tabs */}
                <div style={nextStyles.codeTabWrap}>
                  <div style={nextStyles.tabHeader}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                      {(['cursor', 'claude', 'windsurf', 'vscode'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setMcpClientTab(tab)}
                          style={mcpClientTab === tab ? nextStyles.tabBtnActive : nextStyles.tabBtn}
                        >
                          {tab === 'cursor' ? 'Cursor' : tab === 'claude' ? 'Claude Desktop' : tab === 'windsurf' ? 'Windsurf' : 'VS Code'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        copyCode(
                          mcpClientTab === 'cursor' ? cursorJson
                          : mcpClientTab === 'claude' ? claudeJson
                          : mcpClientTab === 'windsurf' ? windsurfJson
                          : vscodeJson,
                          'mcp-client'
                        )
                      }
                      style={nextStyles.copyButton}
                    >
                      {copiedKey === 'mcp-client' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre style={nextStyles.codeBlock}>
                    {mcpClientTab === 'cursor' ? cursorJson
                      : mcpClientTab === 'claude' ? claudeJson
                      : mcpClientTab === 'windsurf' ? windsurfJson
                      : vscodeJson}
                  </pre>
                </div>

                {/* Per-client config file location */}
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#f4f4f5', borderRadius: 8, fontSize: 13 }}>
                  {mcpClientTab === 'cursor' && <span><strong>Config file:</strong> <code style={nextStyles.inlineCode}>~/.cursor/mcp.json</code> — or Cursor → Settings → Features → MCP Servers</span>}
                  {mcpClientTab === 'claude' && <span><strong>Config file (macOS):</strong> <code style={nextStyles.inlineCode}>~/Library/Application Support/Claude/claude_desktop_config.json</code> — then fully quit and reopen Claude Desktop</span>}
                  {mcpClientTab === 'windsurf' && <span><strong>Config file:</strong> <code style={nextStyles.inlineCode}>~/.codeium/windsurf/mcp_config.json</code> — or Windsurf → Settings → MCP</span>}
                  {mcpClientTab === 'vscode' && <span><strong>VS Code 1.99+:</strong> Add to <code style={nextStyles.inlineCode}>settings.json</code> under <code style={nextStyles.inlineCode}>github.copilot.chat.mcp.servers</code>. In Copilot Chat, switch to <strong>Agent mode</strong> to use MCP tools.</span>}
                </div>

                <h2 id="step3-verify" style={nextStyles.docH2}>Step 3 — Verify the connection</h2>
                <p style={nextStyles.paragraph}>
                  Open your AI client and try one of these prompts:
                </p>
                <div style={nextStyles.promptCard}>
                  "List my Stickle notes"
                </div>
                <div style={{ ...nextStyles.promptCard, marginTop: 8 }}>
                  "Search my Stickle notes for anything about #research"
                </div>
                <p style={{ ...nextStyles.paragraph, marginTop: 16 }}>
                  You should see the 🔧 tool indicator and a response listing your notes. If you get 0 results, re-check that <code style={nextStyles.inlineCode}>~/.stickle/notes.json</code> exists and is non-empty.
                </p>
              </div>
            )}

            {activeDocId === 'mcp-tools' && (
              <div>
                <p style={nextStyles.paragraph}>
                  The Stickle local MCP server exposes <strong>5 tools</strong>. All tool names can be verified in <code style={nextStyles.inlineCode}>mcp-server/index.ts</code>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: '20px 0' }}>
                  {[
                    {
                      name: 'list_stickle_notes',
                      desc: 'List saved browser sticky notes. Returns full metadata including URL, page title, content, tags, color, and timestamps.',
                      params: 'domain?: string, tag?: string, limit?: number (default 50)',
                      example: '"List my notes from github.com" or "Show notes tagged #research"',
                    },
                    {
                      name: 'search_stickle_notes',
                      desc: 'Full-text search across note content, page titles, URLs, and tags.',
                      params: 'query: string (required), tag?: string',
                      example: '"Search my notes for React Server Components"',
                    },
                    {
                      name: 'get_notes_for_url',
                      desc: 'Retrieve all notes anchored to a specific webpage URL (exact or prefix match).',
                      params: 'url: string (required)',
                      example: '"Get my notes for https://news.ycombinator.com"',
                    },
                    {
                      name: 'add_stickle_note',
                      desc: 'Create and attach a new sticky note to any webpage URL.',
                      params: 'url: string (required), content: string (required), pageTitle?: string, tags?: string[], color?: lime|lilac|cream|mint|pink|coral|blue',
                      example: '"Add a note to https://github.com/vercel/next.js: check App Router caching"',
                    },
                    {
                      name: 'export_stickle_summary',
                      desc: 'Generate a structured Markdown report of all notes, grouped by site domain. Great for research digests.',
                      params: 'domain?: string, tag?: string',
                      example: '"Export a Markdown summary of all my notes from wikipedia.org"',
                    },
                  ].map((t) => (
                    <div key={t.name} id={t.name} style={nextStyles.toolCard}>
                      <div style={nextStyles.toolHeader}>
                        <code style={nextStyles.toolName}>{t.name}</code>
                        <span style={nextStyles.toolBadge}>TOOL</span>
                      </div>
                      <p style={nextStyles.toolDesc}>{t.desc}</p>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase' as const }}>Parameters: </span>
                        <code style={nextStyles.inlineCode}>{t.params}</code>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase' as const }}>Try: </span>
                        <span style={{ fontSize: 13, color: '#52525b', fontStyle: 'italic' }}>{t.example}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={nextStyles.calloutTip}>
                  <div style={nextStyles.calloutTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>Remote MCP — Coming Soon</span>
                  </div>
                  <p style={nextStyles.calloutBody}>
                    A future <code style={{ fontFamily: 'monospace' }}>get_team_activity_timeline</code> tool will expose shared team workspace annotations. This is part of the upcoming cloud-hosted remote MCP (paid tier).
                  </p>
                </div>
              </div>
            )}

            {activeDocId === 'notion' && (
              <div>
                <h2 id="create-integration" style={nextStyles.docH2}>1. Create Internal Integration</h2>
                <ol style={nextStyles.orderedList}>
                  <li>Navigate to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ color: '#09090b', fontWeight: 600 }}>notion.so/my-integrations ↗</a>.</li>
                  <li>Click <strong>+ New integration</strong>, name it "Stickle Sync", and select your workspace.</li>
                  <li>Copy your <strong>Internal Integration Secret</strong> (<code style={nextStyles.inlineCode}>secret_...</code>).</li>
                </ol>

                <h2 id="connect-database" style={nextStyles.docH2}>2. Connect Database</h2>
                <ol style={nextStyles.orderedList}>
                  <li>Create or open a Notion database table where you want web notes saved.</li>
                  <li>Click the <strong>•••</strong> menu in Notion → <strong>Connect to</strong> → select "Stickle Sync".</li>
                  <li>Copy the 32-character Database ID from the URL.</li>
                </ol>

                <h2 id="configure-extension" style={nextStyles.docH2}>3. Configure Stickle Settings</h2>
                <p style={nextStyles.paragraph}>
                  Open <strong>Stickle Extension Options → Notion Integration</strong>, paste your API Key and Database ID, and click <strong>Test &amp; Save Connection</strong>.
                </p>
              </div>
            )}

            {activeDocId === 'backup-restore' && (
              <div>
                <h2 id="export-backup" style={nextStyles.docH2}>Exporting Backup (.json)</h2>
                <p style={nextStyles.paragraph}>
                  Click the Stickle extension icon in your toolbar, navigate to <strong>Settings → Data &amp; MCP Setup</strong>, and click <strong>Export Backup (.json)</strong>.
                </p>

                <h2 id="import-backup" style={nextStyles.docH2}>Restoring &amp; Deduplicating</h2>
                <p style={nextStyles.paragraph}>
                  When importing notes on a new browser or machine, Stickle matches incoming IDs and automatically deduplicates notes without overwriting newer modifications.
                </p>
              </div>
            )}

            {activeDocId === 'privacy' && (
              <div>
                <h2 id="local-first-principle" style={nextStyles.docH2}>Local-First Principle</h2>
                <p style={nextStyles.paragraph}>
                  Your thoughts, notes, and research remain strictly on your device. Stickle does not run background telemetry that tracks URLs visited or notes created.
                </p>

                <h2 id="storage-engine" style={nextStyles.docH2}>IndexedDB Storage Engine</h2>
                <p style={nextStyles.paragraph}>
                  All notes and spatial anchors are written to a browser-isolated IndexedDB database using Dexie.js. The data persists safely across browser sessions and operates with zero latency.
                </p>
              </div>
            )}

            {activeDocId === 'contributing' && (
              <div>
                <h2 id="codebase-structure" style={nextStyles.docH2}>Repository &amp; Architecture</h2>
                <p style={nextStyles.paragraph}>
                  Stickle is built on modern web tooling:
                </p>
                <ul style={nextStyles.bulletList}>
                  <li><code style={nextStyles.inlineCode}>entrypoints/</code>: Chrome extension entrypoints (popup, content-scripts, options, docs, onboarding).</li>
                  <li><code style={nextStyles.inlineCode}>components/</code>: NoteBubble and shared Preact UI elements.</li>
                  <li><code style={nextStyles.inlineCode}>lib/</code>: Dexie IndexedDB client, anchoring algorithms, and Notion API client.</li>
                  <li><code style={nextStyles.inlineCode}>mcp-server/</code>: Local Model Context Protocol stdio server.</li>
                </ul>

                <h2 id="local-development" style={nextStyles.docH2}>Local Development Setup</h2>
                <pre style={nextStyles.codeBlock}>
{`# 1. Clone repo
git clone https://github.com/BeeBombshell/stickle.git
cd stickle

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Run test suite
pnpm test

# 5. Build for production
pnpm build`}
                </pre>

                <h2 id="running-tests" style={nextStyles.docH2}>Running Tests (Vitest)</h2>
                <p style={nextStyles.paragraph}>
                  We maintain comprehensive unit and integration tests for DOM anchoring, Notion sync, and MCP tools. Run <code style={nextStyles.inlineCode}>pnpm test</code> before submitting pull requests.
                </p>
              </div>
            )}

            {activeDocId === 'issues-discussions' && (
              <div>
                <h2 id="reporting-bugs" style={nextStyles.docH2}>Reporting Bugs &amp; Regressions</h2>
                <p style={nextStyles.paragraph}>
                  Found an anchoring bug on a specific website or layout? Open an issue on our GitHub tracker:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: '20px 0' }}>
                  <a
                    href="https://github.com/BeeBombshell/stickle/issues/new"
                    target="_blank"
                    rel="noreferrer"
                    style={nextStyles.communityLinkCard}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>🐛 Open Bug Report ↗</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Submit reproducible steps and target URLs.</div>
                  </a>

                  <a
                    href="https://github.com/BeeBombshell/stickle/discussions"
                    target="_blank"
                    rel="noreferrer"
                    style={nextStyles.communityLinkCard}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>💬 GitHub Discussions ↗</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Discuss feature requests, RFCs, and ideas.</div>
                  </a>

                  <a
                    href="https://github.com/BeeBombshell/stickle/pulls"
                    target="_blank"
                    rel="noreferrer"
                    style={nextStyles.communityLinkCard}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>🔀 Pull Requests ↗</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Contribute bug fixes or improvements.</div>
                  </a>
                </div>
              </div>
            )}

            {activeDocId === 'faq' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}>
                  {[
                    {
                      id: 'faq-reloads',
                      q: 'Do notes persist across browser restarts?',
                      a: 'Yes. Stickle persists notes in IndexedDB and re-anchors them whenever you revisit the page URL.',
                    },
                    {
                      id: 'faq-spas',
                      q: 'How does Stickle handle dynamic SPAs (React / Vue)?',
                      a: 'Stickle monitors the DOM with MutationObserver and applies 5-tier fallback recovery within milliseconds of DOM changes.',
                    },
                    {
                      id: 'faq-offline',
                      q: 'Does Stickle require an active internet connection?',
                      a: 'No. The entire extension works 100% offline. Notes, search, and local MCP queries execute entirely locally.',
                    },
                    {
                      id: 'faq-ai',
                      q: 'How do AI coding assistants read my notes?',
                      a: 'Through the local Model Context Protocol (MCP) server. Cursor and Claude Desktop call the provided tools over stdio.',
                    },
                  ].map((f) => (
                    <div key={f.id} id={f.id} style={nextStyles.faqCard}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#09090b' }}>{f.q}</div>
                      <div style={{ fontSize: 14, color: '#52525b', marginTop: 6, lineHeight: 1.5 }}>{f.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ PAGINATION FOOTER CARDS ════════════════════════════════════ */}
            <div style={nextStyles.paginationRow}>
              {currentDoc.prev ? (
                <button
                  onClick={() => {
                    setActiveDocId(currentDoc.prev!.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={nextStyles.pageBtnPrev}
                >
                  <span style={nextStyles.pageBtnLabel}>Previous</span>
                  <span style={nextStyles.pageBtnTitle}>← {currentDoc.prev.title}</span>
                </button>
              ) : <div />}

              {currentDoc.next && (
                <button
                  onClick={() => {
                    setActiveDocId(currentDoc.next!.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={nextStyles.pageBtnNext}
                >
                  <span style={nextStyles.pageBtnLabel}>Next</span>
                  <span style={nextStyles.pageBtnTitle}>{currentDoc.next.title} →</span>
                </button>
              )}
            </div>

            {/* GitHub Edit & Feedback row */}
            <div style={nextStyles.articleFooter}>
              <a
                href="https://github.com/BeeBombshell/stickle"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.editPageLink}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Edit this page on GitHub</span>
              </a>
              <span style={{ fontSize: 12, color: '#a1a1aa' }}>Last updated: August 2026</span>
            </div>
          </div>
        </main>

        {/* ── RIGHT "ON THIS PAGE" TOC SIDEBAR ───────────────────────────────── */}
        <aside className="docs-toc-col" style={nextStyles.tocCol}>
          <div style={nextStyles.tocInner}>
            <div style={nextStyles.tocTitle}>ON THIS PAGE</div>
            <nav style={nextStyles.tocList}>
              {currentDoc.toc.map((t) => (
                <a key={t.id} href={`#${t.id}`} style={nextStyles.tocLink}>
                  {t.label}
                </a>
              ))}
            </nav>

            <div style={nextStyles.tocDivider} />

            <div style={nextStyles.tocTitle}>COMMUNITY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <a
                href="https://github.com/BeeBombshell/stickle/issues/new"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.tocCommunityLink}
              >
                Report an issue ↗
              </a>
              <a
                href="https://github.com/BeeBombshell/stickle/discussions"
                target="_blank"
                rel="noreferrer"
                style={nextStyles.tocCommunityLink}
              >
                Ask a question ↗
              </a>
              <a
                href="/waitlist"
                style={nextStyles.tocCommunityLink}
              >
                Join rollout waitlist ↗
              </a>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={nextStyles.scrollToTopBtn}
            >
              ↑ Scroll to top
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Next.js / Nextra / Fumadocs Aesthetic Design Tokens ───────────────────────
const nextStyles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#09090b',
    fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    height: 56,
    borderBottom: '1px solid #e4e4e7',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  headerInner: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '0 20px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mobileMenuBtn: {
    background: 'none',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    color: '#09090b',
    display: 'flex',
    alignItems: 'center',
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: '#09090b',
  },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#09090b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '-0.4px',
  },
  docsSlash: {
    color: '#d4d4d8',
    fontSize: 14,
    margin: '0 -2px',
  },
  docsLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#71717a',
  },
  versionPill: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 999,
    backgroundColor: '#e4f579',
    color: '#09090b',
    border: '1px solid #d4ee42',
    marginLeft: 4,
  },
  headerCenter: {
    flex: '1 1 auto',
    maxWidth: 420,
    display: 'flex',
    justifyContent: 'center',
  },
  searchBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f4f4f5',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    padding: '4px 10px',
  },
  searchInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    outline: 'none',
    color: '#09090b',
  },
  searchKbd: {
    fontSize: 10,
    fontFamily: 'monospace',
    padding: '2px 5px',
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: 4,
    color: '#71717a',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  topNavLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  topNavLink: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#71717a',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  topNavLinkActive: {
    background: '#f4f4f5',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    color: '#09090b',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#e4e4e7',
  },
  githubStarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 600,
    color: '#09090b',
    backgroundColor: '#f4f4f5',
    border: '1px solid #e4e4e7',
    padding: '5px 12px',
    borderRadius: 6,
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
  },
  mainGrid: {
    maxWidth: 1440,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '256px 1fr 240px',
    minHeight: 'calc(100vh - 56px)',
  },
  sidebar: {
    borderRight: '1px solid #e4e4e7',
    position: 'sticky' as const,
    top: 56,
    maxHeight: 'calc(100vh - 56px)',
    overflowY: 'auto' as const,
    backgroundColor: '#ffffff',
  },
  sidebarInner: {
    padding: '24px 16px 40px',
  },
  navGroup: {
    marginBottom: 24,
  },
  navGroupTitle: {
    fontSize: 11,
    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#71717a',
    margin: '0 0 8px 8px',
  },
  navGroupList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  navItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: 400,
    color: '#52525b',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  navItemActive: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: 600,
    color: '#09090b',
    backgroundColor: '#f4f4f5',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  sidebarFooterLinks: {
    paddingTop: 16,
    borderTop: '1px solid #e4e4e7',
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  extLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 8px',
    fontSize: 12.5,
    color: '#71717a',
    textDecoration: 'none',
  },
  contentArea: {
    padding: '36px 48px 80px',
    minWidth: 0,
  },
  articleWrap: {
    maxWidth: 780,
    margin: '0 auto',
  },
  breadcrumbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    marginBottom: 20,
  },
  categoryPill: {
    display: 'inline-block',
    fontSize: 11,
    fontFamily: "'Geist Mono', monospace",
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#71717a',
    marginBottom: 8,
  },
  docH1: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.8px',
    margin: '0 0 10px 0',
    color: '#09090b',
  },
  docSubhead: {
    fontSize: 16,
    color: '#52525b',
    lineHeight: 1.6,
    margin: 0,
  },
  docH2: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.4px',
    margin: '36px 0 14px 0',
    paddingTop: 8,
    borderTop: '1px solid #f4f4f5',
    color: '#09090b',
  },
  docH3: {
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: '-0.2px',
    margin: '24px 0 10px 0',
    color: '#09090b',
  },
  paragraph: {
    fontSize: 14.5,
    lineHeight: 1.7,
    color: '#3f3f46',
    margin: '0 0 16px 0',
  },
  calloutNote: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderLeft: '4px solid #09090b',
    borderRadius: 8,
    padding: '14px 18px',
    margin: '24px 0',
  },
  calloutTip: {
    backgroundColor: '#fbfdf3',
    border: '1px solid #d4ee42',
    borderLeft: '4px solid #84cc16',
    borderRadius: 8,
    padding: '14px 18px',
    margin: '24px 0',
  },
  calloutTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: '#09090b',
    marginBottom: 6,
  },
  calloutBody: {
    fontSize: 13.5,
    lineHeight: 1.55,
    color: '#52525b',
    margin: 0,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    margin: '20px 0',
  },
  docCard: {
    padding: '18px 20px',
    borderRadius: 10,
    border: '1px solid #e4e4e7',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.15s ease',
  },
  cardIconWrap: {
    fontSize: 20,
    marginBottom: 10,
  },
  cardH3: {
    fontSize: 15,
    fontWeight: 600,
    margin: '0 0 6px 0',
    color: '#09090b',
  },
  cardP: {
    fontSize: 13,
    color: '#71717a',
    lineHeight: 1.5,
    margin: 0,
  },
  codeTabWrap: {
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#09090b',
    overflow: 'hidden',
    margin: '20px 0',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderBottom: '1px solid #27272a',
    padding: '6px 12px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  tabBtnActive: {
    background: '#27272a',
    border: 'none',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  copyButton: {
    background: '#27272a',
    border: 'none',
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  codeBlock: {
    margin: 0,
    padding: 16,
    backgroundColor: '#09090b',
    color: '#e4f579',
    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
    fontSize: 12.5,
    lineHeight: 1.6,
    overflowX: 'auto' as const,
  },
  inlineCode: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 12,
    backgroundColor: '#f4f4f5',
    border: '1px solid #e4e4e7',
    borderRadius: 4,
    padding: '2px 5px',
    color: '#09090b',
  },
  kbd: {
    fontFamily: "'Geist Mono', monospace",
    fontSize: 11,
    backgroundColor: '#f4f4f5',
    border: '1px solid #d4d4d8',
    borderRadius: 4,
    padding: '2px 6px',
    boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
  },
  orderedList: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#3f3f46',
    paddingLeft: 22,
    margin: '12px 0 20px 0',
  },
  bulletList: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#3f3f46',
    paddingLeft: 22,
    margin: '12px 0 20px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13.5,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    borderBottom: '2px solid #e4e4e7',
    color: '#09090b',
    fontWeight: 600,
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #e4e4e7',
    color: '#52525b',
  },
  tierCard: {
    padding: '18px 20px',
    borderRadius: 8,
    border: '1px solid #e4e4e7',
    backgroundColor: '#fafafa',
  },
  tierBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#09090b',
    backgroundColor: '#e4f579',
    padding: '2px 6px',
    borderRadius: 4,
    marginBottom: 6,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#09090b',
  },
  tierDesc: {
    fontSize: 13,
    color: '#52525b',
    lineHeight: 1.5,
    margin: 0,
  },
  promptCard: {
    backgroundColor: '#f4f4f5',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    padding: '12px 16px',
    fontStyle: 'italic',
    fontSize: 13.5,
    color: '#09090b',
    margin: '12px 0',
  },
  toolCard: {
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    padding: '16px 20px',
    backgroundColor: '#ffffff',
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  toolName: {
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'monospace',
    color: '#09090b',
  },
  toolBadge: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: 700,
    backgroundColor: '#f4f4f5',
    color: '#71717a',
    padding: '2px 6px',
    borderRadius: 4,
  },
  toolDesc: {
    fontSize: 13,
    color: '#52525b',
    lineHeight: 1.5,
    margin: 0,
  },
  communityLinkCard: {
    display: 'block',
    padding: '16px',
    borderRadius: 8,
    border: '1px solid #e4e4e7',
    backgroundColor: '#ffffff',
    color: '#09090b',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  faqCard: {
    padding: '16px 18px',
    borderRadius: 8,
    border: '1px solid #e4e4e7',
    backgroundColor: '#ffffff',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid #e4e4e7',
  },
  pageBtnPrev: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  pageBtnNext: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    textAlign: 'right' as const,
    marginLeft: 'auto',
  },
  pageBtnLabel: {
    fontSize: 11,
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  },
  pageBtnTitle: {
    fontSize: 13.5,
    fontWeight: 600,
    color: '#09090b',
    marginTop: 2,
  },
  articleFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    fontSize: 12.5,
  },
  editPageLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#71717a',
    textDecoration: 'none',
  },
  tocCol: {
    borderLeft: '1px solid #e4e4e7',
    position: 'sticky' as const,
    top: 56,
    maxHeight: 'calc(100vh - 56px)',
    overflowY: 'auto' as const,
  },
  tocInner: {
    padding: '28px 20px',
  },
  tocTitle: {
    fontSize: 11,
    fontFamily: "'Geist Mono', monospace",
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#71717a',
    marginBottom: 10,
  },
  tocList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  tocLink: {
    fontSize: 12.5,
    color: '#71717a',
    textDecoration: 'none',
    lineHeight: 1.4,
    transition: 'color 0.15s ease',
  },
  tocDivider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    margin: '20px 0',
  },
  tocCommunityLink: {
    fontSize: 12.5,
    color: '#52525b',
    textDecoration: 'none',
  },
  scrollToTopBtn: {
    marginTop: 24,
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 12,
    color: '#71717a',
    cursor: 'pointer',
  },
};

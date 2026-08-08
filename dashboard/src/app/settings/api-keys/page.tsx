"use client";

import { useState } from "react";

interface KeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRecord[]>([
    {
      id: "key-1",
      name: "Claude Desktop Local",
      key_prefix: "sk_stickle_8f9a...",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      last_used_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ]);
  const [keyName, setKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const fullKey = `sk_stickle_${randomHex}`;
    const newRecord: KeyRecord = {
      id: `key-${Date.now()}`,
      name: keyName.trim(),
      key_prefix: `${fullKey.slice(0, 15)}...`,
      created_at: new Date().toISOString(),
    };

    setKeys([newRecord, ...keys]);
    setNewlyCreatedKey(fullKey);
    setKeyName("");
  };

  const handleCopy = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="color-block color-block-soft border border-[#e5e5e0]">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow text-[#111111]">REMOTE MCP INTEGRATION</span>
          <span className="eyebrow-lime text-[10px]">Pro Feature</span>
        </div>
        <h1 className="display-lg text-[#111111] mb-2">
          API Key Management
        </h1>
        <p className="body-lg text-[#52514e]">
          Create Bearer secret keys to authenticate external AI agents (Claude Desktop, Cursor, Antigravity) with your Stickle Remote MCP server.
        </p>
      </div>

      {/* Secret Key Notification Banner */}
      {newlyCreatedKey && (
        <div className="color-block color-block-navy space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow-lime text-[10px]">
              ⚠️ SAVE KEY NOW — ONLY SHOWN ONCE
            </span>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <p className="text-sm font-sans text-gray-300">
            Copy your API key below. For security, it will not be displayed again.
          </p>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 font-mono text-sm">
            <span className="flex-1 truncate select-all">{newlyCreatedKey}</span>
            <button
              onClick={handleCopy}
              className="btn-pill btn-lime text-xs !px-4 !py-1.5"
            >
              {copied ? "Copied! ✓" : "Copy Key"}
            </button>
          </div>
        </div>
      )}

      {/* Key Generation Form */}
      <div className="color-block color-block-soft border border-[#e5e5e0]">
        <span className="eyebrow text-[#52514e] mb-4">GENERATE NEW API KEY</span>
        <form onSubmit={handleGenerateKey} className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Claude Desktop, Cursor Mac, Team Agent..."
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full border border-[#e5e5e0] text-sm text-[#111111] placeholder-[#52514e]/60 focus:outline-none focus:border-[#111111] bg-white font-sans"
            required
          />
          <button
            type="submit"
            className="btn-pill btn-primary text-sm px-6 py-3"
          >
            Create Key
          </button>
        </form>
      </div>

      {/* Active Keys List */}
      <div className="color-block color-block-soft border border-[#e5e5e0]">
        <span className="eyebrow text-[#52514e] mb-6">ACTIVE KEYS ({keys.length})</span>

        {keys.length === 0 ? (
          <p className="text-sm text-[#52514e] py-4 text-center">
            No active API keys found. Generate a key above to get started.
          </p>
        ) : (
          <div className="divide-y divide-[#e5e5e0]">
            {keys.map((k) => (
              <div key={k.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="card-title text-base text-[#111111] mb-1">{k.name}</div>
                  <div className="flex items-center gap-3 text-xs font-mono text-[#52514e]">
                    <span className="px-2 py-0.5 rounded bg-black/5">{k.key_prefix}</span>
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.last_used_at && (
                      <span>Last used: {new Date(k.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(k.id)}
                  className="btn-pill btn-secondary text-xs !px-4 !py-1.5 text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

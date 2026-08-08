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

    // Generate pseudo secret key format: sk_stickle_<32 hex chars>
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
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
            Remote MCP API Keys
          </h1>
          <span className="px-3 py-1 rounded-full bg-[#e4f579] text-[#111111] text-xs font-mono font-medium">
            Pro Feature
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Create Bearer API keys to authenticate external AI agents (Claude Desktop, Cursor, Antigravity) with your Stickle Remote MCP server endpoint.
        </p>
      </div>

      {/* Secret Key Modal Banner */}
      {newlyCreatedKey && (
        <div className="bg-[#111111] text-white rounded-3xl p-6 border border-black shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#e4f579] text-[#111111] font-semibold">
              ⚠️ Save Key Now — Only Shown Once
            </span>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <p className="text-sm text-gray-300">
            Copy your API key below. For security, it will not be displayed again.
          </p>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 font-mono text-sm">
            <span className="flex-1 truncate select-all">{newlyCreatedKey}</span>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-full bg-[#e4f579] text-[#111111] text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied! ✓" : "Copy Key"}
            </button>
          </div>
        </div>
      )}

      {/* Key Generation Form */}
      <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-sm">
        <h2 className="text-sm font-mono tracking-wider uppercase text-gray-500 mb-4">
          Generate New API Key
        </h2>
        <form onSubmit={handleGenerateKey} className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Claude Desktop, Cursor Mac, Team Agent..."
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-full border border-[#e5e5e5] text-sm text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#111111]"
            required
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black/90 transition-colors shadow-sm"
          >
            Create Key
          </button>
        </form>
      </div>

      {/* Active Keys Table */}
      <div className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-sm">
        <h2 className="text-sm font-mono tracking-wider uppercase text-gray-500 mb-6">
          Active Keys ({keys.length})
        </h2>

        {keys.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No active API keys found. Generate a key above to get started with Remote MCP.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {keys.map((k) => (
              <div key={k.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-[#111111] mb-1">{k.name}</div>
                  <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100">{k.key_prefix}</span>
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.last_used_at && (
                      <span>Last used: {new Date(k.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(k.id)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
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

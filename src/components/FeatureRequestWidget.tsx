'use client';
import React, { useState, useEffect } from 'react';
import { Lightbulb, Send, Trash2, X, ShieldAlert } from 'lucide-react';
import { FEATURE_CHAT_MODE } from '@/config/featureChatConfig';
import { useLanguage } from '@/context/LanguageContext';

interface FeatureItem {
  id: number;
  author: string;
  message: string;
  created_at?: string;
}

export function FeatureRequestWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [devPin, setDevPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (FEATURE_CHAT_MODE === 'false') return null;

  const loadFeatures = async () => {
    try {
      const res = await fetch('/api/features');
      const json = await res.json();
      if (Array.isArray(json.items)) setItems(json.items);
    } catch {}
  };

  useEffect(() => {
    if (open) loadFeatures();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setFeedback('');
    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim() || t.common.driver, message: message.trim() }),
      });
      if (res.ok) {
        setMessage('');
        setFeedback(t.featureChat.sentOk);
        await loadFeatures();
      } else {
        const err = await res.json();
        setFeedback(err.error || t.featureChat.sendError);
      }
    } catch {
      setFeedback(t.featureChat.netError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!devPin.trim()) {
      setFeedback(t.featureChat.pinRequired);
      return;
    }
    if (!id && !window.confirm(t.featureChat.wipeConfirm)) return;
    setLoading(true);
    setFeedback('');
    try {
      const query = id
        ? `id=${id}&pin=${encodeURIComponent(devPin.trim())}`
        : `wipe=all&pin=${encodeURIComponent(devPin.trim())}`;
      const res = await fetch(`/api/features?${query}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setFeedback(id ? t.featureChat.rowDeleted : t.featureChat.wipeDone);
        await loadFeatures();
      } else {
        setFeedback(json.error || t.featureChat.wrongPin);
      }
    } catch {
      setFeedback(t.featureChat.netError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 z-40">
      {open ? (
        <div className="w-80 sm:w-96 bg-[#131720] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[420px]">
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-white" />
              <div>
                <h4 className="text-xs font-bold text-white leading-none">
                  {t.featureChat.headerTitle} {FEATURE_CHAT_MODE === 'developer' && '(DEV)'}
                </h4>
                <span className="text-[10px] text-amber-100">
                  {FEATURE_CHAT_MODE === 'developer' ? t.featureChat.subMod : t.featureChat.subUser}
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-black/20 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {FEATURE_CHAT_MODE === 'developer' && (
            <div className="p-2 bg-[#0e1118] border-b border-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="password"
                value={devPin}
                onChange={(e) => setDevPin(e.target.value)}
                placeholder={t.featureChat.pinPlaceholder}
                className="flex-1 bg-[#0b0d11] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleDelete()}
                disabled={loading || items.length === 0}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-[11px] font-bold"
              >
                {t.featureChat.wipeBtn}
              </button>
            </div>
          )}

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0b0d11]/95 text-xs">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-6">{t.featureChat.empty}</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-[#171c28] border border-gray-800 rounded-lg p-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-400 block">{item.author}</span>
                    <p className="text-gray-200 break-words mt-0.5">{item.message}</p>
                  </div>
                  {FEATURE_CHAT_MODE === 'developer' && (
                    <button type="button" onClick={() => handleDelete(item.id)} title={t.featureChat.deleteTitle} className="p-1 text-gray-400 hover:text-red-400 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {feedback && <div className="px-3 py-1 bg-[#11141b] text-[11px] text-amber-300 border-t border-gray-800">{feedback}</div>}

          {FEATURE_CHAT_MODE === 'true' && (
            <form onSubmit={handleSubmit} className="p-2 bg-[#131720] border-t border-gray-800 space-y-1.5">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={t.featureChat.authorPlaceholder}
                className="w-full bg-[#0b0d11] border border-gray-700 rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.featureChat.msgPlaceholder}
                  className="flex-1 bg-[#0b0d11] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                <button type="submit" disabled={loading || !message.trim()} className="p-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-lg shadow-amber-900/40 transition transform hover:scale-105">
          <Lightbulb className="w-4 h-4" />
          <span>{t.featureChat.buttonLabel}</span>
        </button>
      )}
    </div>
  );
}

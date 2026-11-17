'use client';
import React, { useState, useEffect } from 'react';
import { Lightbulb, Send, Trash2, X, ShieldAlert } from 'lucide-react';
import { FEATURE_CHAT_MODE } from '@/config/featureChatConfig';

interface FeatureItem {
  id: number;
  author: string;
  message: string;
  created_at?: string;
}

export function FeatureRequestWidget() {
  if (FEATURE_CHAT_MODE === 'false') return null;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [devPin, setDevPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

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
        body: JSON.stringify({ author: author.trim() || 'Pilota', message: message.trim() }),
      });
      if (res.ok) {
        setMessage('');
        setFeedback('Richiesta inviata!');
        await loadFeatures();
      } else {
        const err = await res.json();
        setFeedback(err.error || 'Errore invio');
      }
    } catch {
      setFeedback('Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!devPin.trim()) {
      setFeedback('Inserisci prima il PIN Developer.');
      return;
    }
    if (!id && !window.confirm('Confermi il WIPE completo di tutte le richieste?')) return;
    setLoading(true);
    setFeedback('');
    try {
      const query = id
        ? `id=${id}&pin=${encodeURIComponent(devPin.trim())}`
        : `wipe=all&pin=${encodeURIComponent(devPin.trim())}`;
      const res = await fetch(`/api/features?${query}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setFeedback(id ? 'Riga eliminata.' : 'Wipe completato!');
        await loadFeatures();
      } else {
        setFeedback(json.error || 'PIN errato');
      }
    } catch {
      setFeedback('Errore di rete');
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
                  Richieste Feature {FEATURE_CHAT_MODE === 'developer' && '(DEV)'}
                </h4>
                <span className="text-[10px] text-amber-100">
                  {FEATURE_CHAT_MODE === 'developer' ? 'Modalità moderazione' : 'Suggerisci idee per il sito'}
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
                placeholder="PIN Developer"
                className="flex-1 bg-[#0b0d11] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleDelete()}
                disabled={loading || items.length === 0}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-[11px] font-bold"
              >
                WIPE
              </button>
            </div>
          )}

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0b0d11]/95 text-xs">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-6">Nessuna richiesta presente al momento.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#171c28] border border-gray-800 rounded-lg p-2.5 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-400 block">{item.author}</span>
                    <p className="text-gray-200 break-words mt-0.5">{item.message}</p>
                  </div>
                  {FEATURE_CHAT_MODE === 'developer' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Elimina questa riga"
                      className="p-1 text-gray-400 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {feedback && (
            <div className="px-3 py-1 bg-[#11141b] text-[11px] text-amber-300 border-t border-gray-800">{feedback}</div>
          )}

          {FEATURE_CHAT_MODE === 'true' && (
            <form onSubmit={handleSubmit} className="p-2 bg-[#131720] border-t border-gray-800 space-y-1.5">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Il tuo nome (opzionale)"
                className="w-full bg-[#0b0d11] border border-gray-700 rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Scrivi la tua idea o richiesta..."
                  className="flex-1 bg-[#0b0d11] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="p-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-lg shadow-amber-900/40 transition transform hover:scale-105"
        >
          <Lightbulb className="w-4 h-4" />
          <span>Richiedi Feature</span>
        </button>
      )}
    </div>
  );
}

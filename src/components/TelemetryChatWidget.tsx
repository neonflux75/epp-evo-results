'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export function TelemetryChatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Ciao! Sono l\'assistente telemetrico di **EVO RESULTS**. Scrivi il tuo nome (es. *"Mario Rossi"*) per sapere subito la tua posizione in classifica e i tuoi migliori tempi!',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    setChatMessages((p) => [...p, { id: Date.now().toString(), sender: 'user', text: trimmed }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const json = await res.json();
      setChatMessages((p) => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', text: json.reply || 'Nessuna risposta.' }]);
    } catch {
      setChatMessages((p) => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Errore di connessione con il server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderFormattedText = (text: string) =>
    text.split('\n').map((line, i) => (
      <div key={i} className={i > 0 ? 'mt-1' : ''}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="text-white font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </div>
    ));

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {chatOpen ? (
        <div className="w-80 sm:w-96 bg-[#131720] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[440px]">
          <div className="bg-gradient-to-r from-red-700 to-red-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <h4 className="text-sm font-bold text-white leading-none">Assistente Tempi EVO</h4>
                <span className="text-[10px] text-red-200">Cerca posizione e giri veloci</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 rounded-lg hover:bg-black/20 text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b0d11]/90 text-xs">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-[#171c28] text-gray-200 border border-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'bot' ? renderFormattedText(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#171c28] text-gray-400 border border-gray-800 rounded-xl rounded-bl-none px-3 py-2 text-xs animate-pulse">
                  Controllo la telemetria...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChatMessage} className="p-2.5 bg-[#131720] border-t border-gray-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Es. Mario Rossi o Posizione Imola..."
              className="flex-1 bg-[#0b0d11] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-lg shadow-red-900/40 transition transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Assistente Tempi</span>
        </button>
      )}
    </div>
  );
}

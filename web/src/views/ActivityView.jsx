import React, { useState } from 'react';
import {
  Clock,
  Trash2,
  Volume2,
  Copy,
  Check,
  Eye,
  FileText,
  Mic,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ActivityView() {
  const {
    history,
    removeActivity,
    clearHistory,
    playSpeech,
    navigateTo,
    announce
  } = useApp();

  const [filter, setFilter] = useState('all'); // 'all' | 'vision' | 'reader' | 'assistant'
  const [copiedId, setCopiedId] = useState(null);

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    announce('Text copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'vision': return Eye;
      case 'reader': return FileText;
      case 'assistant': return Mic;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Title & Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
            Recent Activity
          </h1>
          <p className="text-xs sm:text-sm text-[#535E56] font-medium">
            Review and replay your captured descriptions, OCR scans, and assistant answers
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your activity history?')) {
                clearHistory();
                announce('Activity history cleared.');
              }
            }}
            aria-label="Clear all activity history"
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-[#A62C2C] text-[#A62C2C] hover:bg-[#FBE8E5] font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={16} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter history">
        {[
          { id: 'all', label: `All (${history.length})` },
          { id: 'vision', label: 'Vision' },
          { id: 'reader', label: 'Reader' },
          { id: 'assistant', label: 'Voice' }
        ].map(({ id, label }) => {
          const isSelected = filter === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setFilter(id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#204C3A] text-white shadow-xs'
                  : 'bg-[#EFECE2] text-[#535E56] hover:text-[#202821]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* History Items List */}
      {filtered.length > 0 ? (
        <div className="space-y-3" role="feed" aria-label="Recent activity entries">
          {filtered.map((item) => {
            const Icon = getIcon(item.type);
            const timeFormatted = new Date(item.timestamp).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <article
                key={item.id}
                className="bg-white border-2 border-[#DDD8CB] hover:border-[#204C3A]/50 rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#E9EFE5] text-[#204C3A] flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-[#202821]">
                        {item.title}
                      </h2>
                      <time className="text-[11px] text-[#535E56] font-medium block">
                        {timeFormatted}
                      </time>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playSpeech(item.text, item.title)}
                      aria-label={`Read aloud: ${item.title}`}
                      className="p-2 rounded-lg text-[#204C3A] hover:bg-[#EFECE2] transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 size={18} />
                    </button>

                    <button
                      onClick={() => handleCopy(item.id, item.text)}
                      aria-label="Copy text to clipboard"
                      className="p-2 rounded-lg text-[#535E56] hover:bg-[#EFECE2] transition-colors"
                      title="Copy text"
                    >
                      {copiedId === item.id ? <Check size={18} className="text-[#1B5E20]" /> : <Copy size={18} />}
                    </button>

                    <button
                      onClick={() => removeActivity(item.id)}
                      aria-label={`Delete entry: ${item.title}`}
                      className="p-2 rounded-lg text-[#A62C2C] hover:bg-[#FBE8E5] transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Text Content Preview */}
                <p className="text-xs sm:text-sm text-[#202821] font-medium leading-relaxed select-text bg-[#FDFBF7] p-3 rounded-xl border border-[#EFECE2]">
                  {item.text}
                </p>

                {item.thumbnail && (
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#DDD8CB] bg-black shrink-0">
                    <img src={item.thumbnail} alt="Activity snapshot" className="w-full h-full object-cover" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#EFECE2] border-2 border-dashed border-[#DDD8CB] rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <Clock size={48} className="mx-auto text-[#A8B9A0]" />
          <div>
            <h2 className="text-lg font-black text-[#202821]">No Activity Saved Yet</h2>
            <p className="text-xs text-[#535E56] max-w-sm mx-auto mt-1 font-medium">
              When you capture scenes with AI Vision or scan documents with Smart Reader, your history will appear here.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('vision')}
              className="min-h-[48px] px-5 bg-[#204C3A] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
            >
              <span>Launch AI Vision</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigateTo('reader')}
              className="min-h-[48px] px-5 bg-white border border-[#DDD8CB] text-[#202821] font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <span>Open Smart Reader</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

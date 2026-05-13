import React, { useEffect, useRef, useState } from 'react';
import { useGetTradeStream } from "@/lib/api";
import { Radio, Terminal, Download, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { Be } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

const TYPE_COLORS: Record<string, string> = {
  SCANNING: "text-zinc-500",
  DETECTED: "text-amber-400",
  EXECUTED: "text-emerald-400",
  FAILED: "text-red-500",
  OPTIMIZATION: "text-cyan-400 font-bold italic",
  WALLET_FLOW: "text-purple-400 font-bold"
};

export default function SystemLogs() {
  const { data: streamRes, isLoading, error } = useGetTradeStream({
    refetchInterval: 1000
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const events = streamRes?.events ?? [];
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['INFO', 'WARN', 'ERROR', 'SUCCESS', 'SCANNING', 'DETECTED', 'EXECUTED', 'FAILED', 'OPTIMIZATION', 'WALLET_FLOW']);
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();

  const filteredEvents = events.filter(event => selectedLevels.includes(event.type));

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Message', 'Block Number'];
    const rows = filteredEvents.map(event => [
      event.timestamp ? format(new Date(event.timestamp), "yyyy-MM-dd HH:mm:ss") : '',
      event.type,
      event.message,
      event.blockNumber || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    addToast('Log clearing not implemented in demo - logs will refill automatically', 'warning');
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Terminal size={16} className="text-cyan-500" />
        <h1 className="text-white text-sm font-bold uppercase tracking-[0.2em]">System Logs</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded bg-ash-dark hover:bg-ash-dark/80 transition-colors border border-ash-border"
            title="Toggle Filters"
          >
            <Filter size={12} className="text-ash-muted" />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded bg-ash-dark hover:bg-ash-dark/80 transition-colors border border-ash-border"
            title="Export CSV"
          >
            <Download size={12} className="text-ash-muted" />
          </button>
          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded bg-ash-dark hover:bg-ash-dark/80 transition-colors border border-ash-border"
            title="Clear Logs"
          >
            <Trash2 size={12} className="text-ash-muted" />
          </button>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Engine Live</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {showFilters && (
        <div className="bg-ash-dark border border-ash-border rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Filter by Level</h3>
          <div className="flex flex-wrap gap-2">
            {['INFO', 'WARN', 'ERROR', 'SUCCESS', 'SCANNING', 'DETECTED', 'EXECUTED', 'FAILED', 'OPTIMIZATION', 'WALLET_FLOW'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-3 py-1 rounded text-xs font-medium uppercase tracking-wider transition-colors ${
                  selectedLevels.includes(level)
                    ? 'bg-cyan-accent text-black'
                    : 'bg-ash-black text-ash-muted hover:text-white border border-ash-border'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 bg-[#111217] border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-1.5 border-b border-zinc-800 bg-black/20 flex items-center gap-2">
          <Terminal size={12} className="text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Ticks</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed">
          {isLoading && <div className="text-zinc-700 text-center mt-20 uppercase font-black tracking-tighter">Connecting to activity stream...</div>}
          {!isLoading && error && <div className="text-red-400 text-center mt-20 uppercase font-black tracking-tighter">Stream unavailable</div>}
          {!isLoading && !error && filteredEvents.length === 0 && events.length > 0 && <div className="text-zinc-800 text-center mt-20 uppercase font-black tracking-tighter">No logs match current filters</div>}
          {!isLoading && !error && events.length === 0 && <div className="text-zinc-800 text-center mt-20 uppercase font-black tracking-tighter">Waiting for engine tick...</div>}
          {filteredEvents.map((event: any, i: number) => (
            <div key={event.id || i} className="flex gap-4 items-start py-1 border-b border-zinc-900/30 hover:bg-zinc-900/20 transition-all">
              <span className="text-zinc-600 shrink-0 select-none font-mono tabular-nums">
                [{event.timestamp ? format(new Date(event.timestamp), "HH:mm:ss") : "--:--:--"}]
              </span>
              <span className={Be("shrink-0 uppercase text-[10px] font-black", TYPE_COLORS[event.type])}>
                {event.type.padEnd(12)}
              </span>
              <span className="text-zinc-400 font-medium">{event.message}</span>
              {event.blockNumber && <span className="ml-auto text-zinc-700 font-bold italic font-mono tabular-nums">#{event.blockNumber}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

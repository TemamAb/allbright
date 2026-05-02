import React, { useEffect, useRef } from 'react';
import { useGetTradeStream } from "@/lib/api";
import { Radio, Terminal } from "lucide-react";
import { format } from "date-fns";
import { Be } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  SCANNING: "text-zinc-500",
  DETECTED: "text-amber-400",
  EXECUTED: "text-emerald-400",
  FAILED: "text-red-500",
  OPTIMIZATION: "text-cyan-400 font-bold italic",
  WALLET_FLOW: "text-purple-400 font-bold"
};

export default function Stream() {
  const { data: streamRes } = useGetTradeStream({ 
    query: { refetchInterval: 1000 } 
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const events = streamRes?.events ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Radio size={16} className="text-cyan-500" />
        <h1 className="text-white text-sm font-bold uppercase tracking-[0.2em]">Protocol Activity Ingestion</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Engine Live</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      <div className="flex-1 bg-[#111217] border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-1.5 border-b border-zinc-800 bg-black/20 flex items-center gap-2">
          <Terminal size={12} className="text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Ticks</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed">
          {events.length === 0 && <div className="text-zinc-800 text-center mt-20 uppercase font-black tracking-tighter">Waiting for engine tick...</div>}
          {events.map((event: any, i: number) => (
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
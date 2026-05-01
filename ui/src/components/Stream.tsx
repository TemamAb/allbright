import React, { useEffect, useRef } from 'react';
import { useGetTradeStream } from "@/lib/api";
import { Radio, Terminal } from "lucide-react";
import { format } from "date-fns";
import { Be } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  SCANNING: "text-zinc-500",
  DETECTED: "text-amber-400",
  EXECUTED: "text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]",
  FAILED: "text-red-500"
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
        <Radio size={20} className="text-cyan-500 animate-pulse" />
        <h1 className="text-white text-lg font-black uppercase tracking-widest">Watchtower Stream</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Feed</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      <div className="flex-1 bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-4 py-2 border-b border-zinc-800 bg-[#111217] flex items-center gap-2">
          <Terminal size={12} className="text-zinc-500" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">BSS-Nexus Event Ingestion</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed">
          {events.length === 0 && <div className="text-zinc-800 text-center mt-20 uppercase font-black tracking-tighter">Waiting for engine tick...</div>}
          {events.map((event: any, i: number) => (
            <div key={event.id || i} className="flex gap-4 items-start py-1 border-b border-zinc-900/30 hover:bg-zinc-900/20 transition-all">
              <span className="text-zinc-700 shrink-0 select-none">
                [{event.timestamp ? format(new Date(event.timestamp), "HH:mm:ss") : "--:--:--"}]
              </span>
              <span className={Be("shrink-0 font-bold uppercase", TYPE_COLORS[event.type])}>
                {event.type.padEnd(8)}
              </span>
              <span className="text-zinc-300">{event.message}</span>
              {event.blockNumber && <span className="ml-auto text-zinc-700 font-bold italic">#{event.blockNumber}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
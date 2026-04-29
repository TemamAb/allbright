import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../App";
import { toast } from "sonner";
import SpecialistDashboard from "../components/SpecialistDashboard";
import EventTimeline from "../components/EventTimeline";
import CommandPalette from "../components/CommandPalette";
import { LucideIcon, Play, Send, Zap, Shield, Activity, Settings, Bolt, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function Copilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role: "user" | "copilot"; content: string; timestamp: number;}>>([]);
  const [loading, setLoading] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [events, setEvents] = useState<Array<{type: string; message: string; timestamp: number}>>([]);
  const [status, setStatus] = useState({ online: true, specialists: 7, alerts: 0 });
  const { socket, isConnected } = useSocket();

  // Live telemetry subscription
  useEffect(() => {
    if (socket) {
      socket.on('copilot-status', (data: any) => {
        setStatus(data);
      });
      socket.on('copilot-event', (event: any) => {
        setEvents(prev => [event, ...prev.slice(0, 19)]);
        if (event.type === 'alert') toast.error(event.message);
        else if (event.type === 'success') toast.success(event.message);
      });
      socket.emit('copilot-subscribe');
    }
    return () => socket?.off('copilot-status', () => {});
  }, [socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user" as const, content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`/api/copilot/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: userInput }),
      });

      if (!response.ok) throw new Error(`API: ${response.status}`);

      const data = await response.json();
      setMessages(prev => [...prev, { role: "copilot" as const, content: data.response, timestamp: Date.now() }]);
      toast.success("Mission command executed");
    } catch (err) {
      const errMsg = `Error: ${err instanceof Error ? err.message : String(err)}`;
      setMessages(prev => [...prev, { role: "copilot" as const, content: errMsg, timestamp: Date.now() }]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaletteSelect = async (commandId: string) => {
    const commands: Record<string, string> = {
      'tune-kpis': 'fullKpiTuneCycle',
      'analyze-perf': 'analyzePerformance',
      'dispatch-order': 'handleRouteDispatch target:bss_16',
      'redeploy': 'executeMissionCommand "pnpm restart"',
    };
    const command = commands[commandId] || 'analyzePerformance';
    setInput(command);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-8">
      {/* Command Palette */}
      <CommandPalette 
        open={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />

      {/* Mission Control Header */}
        <div className="mb-12 text-center">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center backdrop-blur-lg border border-primary/30 animate-pulse shadow-neon">
           <Brain className="w-16 h-16 text-primary opacity-80" />
         </div>
        <h1 className="mt-6 text-5xl font-black bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent">
          ALPHA-COPILOT
        </h1>
        <p className="mt-3 text-xl text-slate-400 max-w-2xl mx-auto">
          Mission Control for BrightSky Trading System
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-800/50">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
            <span className="text-sm">● Live Telemetry: {isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-800/50">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">● Specialists: {status.specialists}/7</span>
          </div>
          {status.alerts > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-full backdrop-blur-sm border border-red-500/50">
              <Shield className="w-4 h-4" />
              <span className="text-sm">● {status.alerts} Alerts</span>
            </div>
          )}
        </div>
         <div className="mt-6 flex gap-2 justify-center">
           <motion.button 
             onClick={() => setIsPaletteOpen(true)}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="flex items-center gap-2 bg-gradient-to-r from-primary/90 to-secondary/90 hover:from-primary/100 hover:to-secondary/100 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-neon transition-all"
           >
             <Activity className="w-5 h-5" />
             Open Command Palette (⌘K)
           </motion.button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Chat + Dashboard */}
        <div className="space-y-6">
          <SpecialistDashboard />
          
          {/* Chat History */}
          <div className="glass-panel h-[500px] overflow-y-auto transition-all hover:shadow-neon">
            {messages.map((msg, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 ${msg.role === "user" ? "text-right" : "text-left"}`}
              >
                <div className={`inline-block max-w-[75%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 ml-auto" 
                    : "bg-gradient-to-r from-slate-700/40 to-slate-800/40 border border-slate-700/50"
                } backdrop-blur-sm shadow-lg`}>
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{msg.content}</pre>
                  <div className="text-xs opacity-75 mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="text-left mb-6">
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 p-4 rounded-2xl inline-block backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm font-mono">Alpha-Copilot processing mission...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

           {/* Command Input */}
           <form onSubmit={handleSubmit} className="glass-panel p-4 rounded-2xl border border-slate-800/50 transition-all hover:shadow-neon">
             <div className="flex gap-3">
               <input
                 placeholder="Enter mission command or question..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 className="flex-1 bg-slate-900/50 border border-slate-800/50 text-slate-200 placeholder-slate-500 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                 disabled={loading}
               />
               <motion.button
                 type="submit"
                 disabled={loading || !input.trim()}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="w-14 h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-slate-900 rounded-2xl shadow-lg hover:shadow-neon flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-current rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
               </motion.button>
             </div>
           </form>
        </div>

        {/* Right Column: Live Data */}
        <div className="space-y-6">
          <EventTimeline />
          
          {/* Status Widgets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-6 h-6 text-green-400" />
                <h4 className="font-bold">System Health</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>IPC Bridge</span>
                  <span className="font-mono text-green-400">✓ LIVE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DB Sync</span>
                  <span className="font-mono text-green-400">✓ SYNCED</span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-[92%]" />
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-5 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Bolt className="w-6 h-6 text-yellow-400 animate-pulse" />
                <h4 className="font-bold">Performance</h4>
              </div>
              <div className="text-3xl font-black text-primary mb-2">94.7%</div>
              <div className="w-full bg-slate-800/50 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full w-[95%]" />
              </div>
              <div className="text-xs text-slate-500 mt-1">+2.3% from last cycle</div>
            </div>
          </div>

           {/* Quick Actions */}
           <div className="glass-panel p-6 rounded-2xl">
             <h4 className="font-bold mb-4 flex items-center gap-2">
               <Settings className="w-5 h-5" />
               Quick Mission Actions
             </h4>
             <div className="grid grid-cols-2 gap-3">
               <motion.button 
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
                 className="group flex flex-col items-center p-3 hover:bg-primary/20 rounded-xl transition-all border border-slate-800/50 hover:border-primary/30 hover:shadow-neon"
               >
                 <Zap className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                 <span className="text-sm mt-1 font-medium">Emergency Tune</span>
               </motion.button>
               <motion.button 
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
                 className="group flex flex-col items-center p-3 hover:bg-green-500/20 rounded-xl transition-all border border-slate-800/50 hover:border-green-500/30 hover:shadow-neon"
               >
                 <Shield className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                 <span className="text-sm mt-1 font-medium">Risk Audit</span>
               </motion.button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

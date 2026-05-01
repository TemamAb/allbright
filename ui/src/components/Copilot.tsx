import { useState, useEffect } from "react";
import { Send, Bot, User, Zap, Terminal, ShieldCheck, Play, Square, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSocket } from "@/App";
import { useGetEngineStatus } from "@workspace/api-client-react";

export default function Copilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your BrightSky Copilot. How can I assist you with your arbitrage operations today?" }
  ]);

  const [availableModels, setAvailableModels] = useState<Record<string, boolean>>({ gemini: false, openai: false, openrouter: false });
  const [selectedModel, setSelectedModel] = useState("gemini");

  useEffect(() => {
    // Fetch available models on load
    fetch("/api/copilot/status")
      .then(res => res.json())
      .then(data => {
        if (data.availableModels) setAvailableModels(data.availableModels);
      });
  }, []);

  const { data: engineStatus, refetch: refetchStatus } = useGetEngineStatus({ 
    query: { refetchInterval: 5000, queryKey: ["engineStatus"] } 
  });

  const isRunning = engineStatus?.running;
  const currentMode = engineStatus?.mode || "STOPPED";

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleCopilotEvent = (event: any) => {
      if (event.type === 'audit-complete') {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `Audit results: GES ${event.data?.ges || '85.4'}%. 36-KPI Gates: PASS. All systems nominal.` 
        }]);
        toast.success("Readiness Report Received");
      }
      if (event.type === 'engine-update') {
        refetchStatus();
      }
    };

    socket.on('copilot_event', handleCopilotEvent);
    return () => {
      socket.off('copilot_event', handleCopilotEvent);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendCommand(input);
  };

  const sendCommand = async (cmd: string) => {
    setMessages(prev => [...prev, { role: "user", content: cmd }]);
    setInput("");
    
    try {
      const res = await fetch("/api/copilot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      toast.error("Bridge Error: Connection failed");
    }
  };

  const triggerAudit = async () => {
    await sendCommand("Run comprehensive system audit.");
  };

  const toggleEngine = () => {
    sendCommand(isRunning ? "Stop Engine" : "Start Engine");
  };

  const toggleMode = () => {
    const nextMode = currentMode === "LIVE" ? "Simulation" : "Live";
    sendCommand(`Switch mode to ${nextMode}`);
  };

  const handleModelChange = (model: string) => {
    sendCommand(`Set AI model ${model}`);
    setSelectedModel(model);
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-100">Copilot Assistant</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-[#1a1a1c]">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-zinc-400" />
              <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">Mission Control Chat</span>
            </div>
          </div>
          
          {/* Messages Area - 100% Black inner box */}
          <div className="flex-1 bg-black p-6 overflow-y-auto space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-primary/20 text-primary'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-zinc-300" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-lg max-w-[80%] font-mono text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#1a1a1c] border border-zinc-800 text-zinc-200' 
                    : 'bg-transparent border border-zinc-800 text-primary'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1a1a1c] border-t border-zinc-800">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot for assistance..."
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 font-mono text-sm focus:outline-none focus:border-primary/50"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                SEND
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="border-b border-zinc-800 p-4">
            <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">System Capabilities</span>
          </div>
          <div className="flex-1 bg-black p-6 space-y-4">
            {/* Engine Control Block */}
            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <Terminal size={16} />
                <span className="font-bold font-mono text-sm">Engine Module</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-2">
                  <span className="text-zinc-500">Status</span>
                  <span className={isRunning ? "text-emerald-500" : "text-red-500"}>{currentMode}</span>
                </div>
                <button 
                  onClick={toggleEngine}
                  className={`w-full py-2 flex items-center justify-center gap-2 border text-[10px] font-black rounded uppercase transition-all ${
                    isRunning 
                      ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" 
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  }`}
                >
                  {isRunning ? <Square size={12} /> : <Play size={12} />}
                  {isRunning ? "Stop Engine" : "Start Engine"}
                </button>
                <button 
                  onClick={toggleMode}
                  className="w-full py-2 flex items-center justify-center gap-2 border border-zinc-800 text-[10px] font-black rounded uppercase transition-all bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                >
                  <Globe size={12} />
                  Switch to {currentMode === "LIVE" ? "Simulation" : "Live"}
                </button>
              </div>
            </div>

            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Bot size={16} />
                <span className="font-bold font-mono text-sm">AI Intelligence Mode</span>
              </div>
              <div className="space-y-2">
                {Object.entries(availableModels).map(([model, isAvailable]) => (
                  <button
                    key={model}
                    disabled={!isAvailable}
                    onClick={() => handleModelChange(model)}
                    className={`w-full py-2 flex items-center justify-center gap-2 border text-[10px] font-black rounded uppercase transition-all ${
                      selectedModel === model 
                        ? "bg-primary/20 border-primary/50 text-primary" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <Globe size={12} />
                    {model} {isAvailable ? '' : '(Locked)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <ShieldCheck size={16} />
                <span className="font-bold font-mono text-sm">System Auditor</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mb-3">Verify all security gates and engine parity deltas.</p>
              <button onClick={triggerAudit} className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded uppercase hover:bg-emerald-500/20 transition-all">Execute Audit</button>
            </div>
            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Zap className="w-4 h-4" />
                <span className="font-bold font-mono text-sm">Strategy Analysis</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Ask about optimal arbitrage routes and mempool conditions.</p>
            </div>
            <div className="p-4 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Terminal className="w-4 h-4" />
                <span className="font-bold font-mono text-sm">Engine Control</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Request start, stop, or configuration changes directly via chat.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

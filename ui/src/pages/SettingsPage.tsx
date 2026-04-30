import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetEngineStatus } from "@workspace/api-client-react";
import { Play, Square, Zap, Activity } from "lucide-react";

export default function SettingsPage() {
  const [mode, setMode] = useState<"live" | "simulation">("simulation");
  const [isRunning, setIsRunning] = useState(false);
useGetEngineStatus({ query: { refetchInterval: 2000, queryKey: ["engineStatus"] } });

  const handleStart = async () => {
    const response = await fetch('/api/engine/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: mode.toUpperCase() }),
    });
    if (response.ok) setIsRunning(true);
  };

  const handleStop = async () => {
    const response = await fetch('/api/engine/stop', { method: 'POST' });
    if (response.ok) setIsRunning(false);
  };

  return (
    <div className="space-y-6 max-w-md p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Zap className="w-8 h-8" />
        Engine Control
      </h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v as "live" | "simulation")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simulation">
                <Activity className="mr-2 h-4 w-4" />
                Simulation
              </SelectItem>
              <SelectItem value="live">
                <Zap className="mr-2 h-4 w-4" />
                Live
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleStart} 
            disabled={isRunning}
            className="flex-1"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Running..." : "Start Engine"}
          </Button>
          <Button 
            onClick={handleStop}
            variant="destructive"
            disabled={!isRunning}
            size="lg"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>

        {status && (
          <div className={`text-xl font-bold p-4 rounded-lg text-center ${
            status.running 
              ? status.mode === 'LIVE' 
                ? 'bg-green-500/10 border-green-500/30 text-green-600' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' 
              : 'bg-gray-500/10 border-gray-500/30 text-gray-500'
          }`}>
            {status.running ? `Engine running ${status.mode?.toLowerCase()}` : 'Engine stopped'}
          </div>
        )}
      </div>
    </div>
  );
}


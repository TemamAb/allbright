import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Loader2, Database, Server, Terminal, Info, AlertTriangle, Ghost, Shield, UserCircle, Globe2, Phone, Pencil, Save, X, Download, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { DeploymentRegistryTable } from './DeploymentRegistryTable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/toggle'; // Assuming common internal toggle

/**
 * BSS-56 System Hub
 * Orchestrates environment parameters and provides manual redeploy overrides.
 */
export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [integrityThreshold, setIntegrityThreshold] = useState(70);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [configIntegrity, setConfigIntegrity] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [registryData, setRegistryData] = useState([]);
  const [logs, setLogs] = useState<{ id: string; msg: string; time: string; type: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: string = 'INFO') => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      msg,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
  };

  const checkIntegrity = async () => {
    try {
      const res = await fetch('/api/settings/config-integrity', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('bs_auth_token')}` }
      });
      const data = await res.json();
      if (data.success) setConfigIntegrity(data.comparison);
    } catch (e) {}
  };

  // Simulate or connect to socket for real-time logs
  useEffect(() => {
    const demoLogs = [
      "BSS-01: Connectivity established to Rust backbone",
      "BSS-28: Alpha-Copilot meta-learner initialized",
      "BSS-43: Deployment readiness gate synchronized"
    ];
    demoLogs.forEach((l, i) => setTimeout(() => addLog(l), i * 500));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setRegistryData(data.deploymentRegistry || []);
        setGhostMode(data.ghostMode || false);
        setIntegrityThreshold(data.integrityThreshold || 70);
        setProfile(data.clientProfile || null);
        if (!editedProfile) setEditedProfile(data.clientProfile);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    checkIntegrity();
    const interval = setInterval(fetchSettings, 10000); // Polling for registry updates
    return () => clearInterval(interval);
  }, []);

  const handleRedeploy = async () => {
    setIsRedeploying(true);
    try {
      const response = await fetch('/api/settings/redeploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Redeploy command dispatched to Alpha-Copilot.");
        addLog("SYSTEM: Manual redeploy command executed", "WARN");
        fetchSettings(); // Refresh registry immediately to show 'UPGRADE' record
      } else {
        toast.error(data.error || "Redeploy failed.");
      }
    } catch (err) {
      toast.error("Bridge connection failed.");
    } finally {
      setIsRedeploying(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const envPayload = [
        { key: 'OWNER_NAME', value: editedProfile.name },
        { key: 'OWNER_EMAIL', value: editedProfile.email },
        { key: 'OWNER_TEL', value: editedProfile.tel },
        { key: 'OWNER_COUNTRY', value: editedProfile.country }
      ];
      
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envPayload })
      });
      
      if (res.ok) {
        setIsEditingProfile(false);
        toast.success("Operator profile updated successfully.");
        fetchSettings();
      }
    } catch (e) { toast.error("Failed to update profile."); }
  };

  const updateThreshold = async (val: string) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 0 || num > 100) return;
    setIntegrityThreshold(num);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { integrityThreshold: num } })
    });
  };

  const toggleGhostMode = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ghostMode: enabled } })
      });
      const data = await res.json();
      if (data.success) {
        setGhostMode(enabled);
        toast.success(enabled ? "Identity Masking Active" : "Standard Identity Restored");
      }
    } catch (e) {
      toast.error("Failed to sync identity state");
    }
  };

  return (
    <div className="p-6 bg-[#1e1e1e] min-h-screen text-[#d8d9da] space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="text-[#5794f2]" />
            System Hub
          </h1>
          <p className="text-xs text-[#8e8e8e] uppercase tracking-widest mt-1">Infrastructure Control & Environment Persistence</p>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleRedeploy} 
                disabled={isRedeploying}
                className="bg-[#73bf69] hover:bg-[#5da053] text-[#1e1e1e] font-black h-11 px-6 shadow-none transition-all active:scale-95 flex items-center gap-2"
              >
                {isRedeploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                System Reboot
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#2d2d2d] border-[#404040] text-[#d8d9da] max-w-xs">
              <div className="flex gap-2 p-1">
                <AlertTriangle className="w-4 h-4 text-[#f2cc0c] shrink-0" />
                <p className="text-[11px] leading-tight">Flushes path cache and re-evaluates <b>V2C Integrity</b>. Excessive reboots without ROI improvement may trigger the Over-Engineering wall.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* BSS-56: Config Integrity Audit */}
      <Card className="bg-[#1e1e1e] border-[#404040] shadow-none">
        <CardHeader className="py-4 border-b border-[#404040] bg-[#2d2d2d]/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs uppercase tracking-widest text-[#d8d9da] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#73bf69]" />
              Infrastructure Integrity Audit
            </CardTitle>
            <Button onClick={checkIntegrity} variant="ghost" size="sm" className="h-6 text-[10px] text-[#5794f2]">Verify Sync</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#1e1e1e] border-b border-[#404040]">
                <tr>
                  <th className="p-3 text-[9px] uppercase text-[#8e8e8e]">Key</th>
                  <th className="p-3 text-[9px] uppercase text-[#8e8e8e]">Desktop</th>
                  <th className="p-3 text-[9px] uppercase text-[#8e8e8e]">Cloud</th>
                  <th className="p-3 text-[9px] uppercase text-[#8e8e8e] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#404040]">
                {configIntegrity.map((item) => (
                  <tr key={item.key} className="hover:bg-[#2d2d2d]/50 transition-colors">
                    <td className="p-3 font-mono text-[10px] text-[#d8d9da]">{item.key}</td>
                    <td className="p-3 font-mono text-[10px] text-[#8e8e8e]">{item.localValue}</td>
                    <td className="p-3 font-mono text-[10px] text-[#8e8e8e]">{item.cloudValue}</td>
                    <td className="p-3 text-right">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'MATCH' ? 'text-[#73bf69] bg-[#73bf69]/10' : 'text-[#f2cc0c] bg-[#f2cc0c]/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Client Profile Registry */}
      <Card className="bg-[#2d2d2d] border-[#404040] shadow-none">
        <CardHeader className="border-b border-[#404040] py-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm uppercase tracking-wider text-[#d8d9da] flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-[#73bf69]" />
              Active Operator Profile
            </CardTitle>
          </div>
          {isEditingProfile ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)} className="text-[#8e8e8e] h-8"><X size={14}/></Button>
              <Button size="sm" onClick={handleSaveProfile} className="bg-[#73bf69] text-[#1e1e1e] h-8 font-bold"><Save size={14} className="mr-1"/> Save</Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditingProfile(true)}
              className="border-[#404040] text-[#8e8e8e] hover:text-[#d8d9da] h-8"
            >
              <Pencil size={14} className="mr-1"/> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {profile ? (isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] text-[#8e8e8e] uppercase">Name</Label>
                <Input value={editedProfile.name} onChange={e => setEditedProfile({...editedProfile, name: e.target.value})} className="bg-[#1e1e1e] border-[#404040] text-xs h-8"/>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-[#8e8e8e] uppercase">Email</Label>
                <Input value={editedProfile.email} onChange={e => setEditedProfile({...editedProfile, email: e.target.value})} className="bg-[#1e1e1e] border-[#404040] text-xs h-8"/>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-[#8e8e8e] uppercase">Telephone</Label>
                <Input value={editedProfile.tel} onChange={e => setEditedProfile({...editedProfile, tel: e.target.value})} className="bg-[#1e1e1e] border-[#404040] text-xs h-8"/>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-[#8e8e8e] uppercase">Country</Label>
                <Input value={editedProfile.country} onChange={e => setEditedProfile({...editedProfile, country: e.target.value})} className="bg-[#1e1e1e] border-[#404040] text-xs h-8"/>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] text-[#8e8e8e] uppercase font-bold">Operator Name</p>
                <p className="text-sm font-semibold text-[#d8d9da]">{profile.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[#8e8e8e] uppercase font-bold">Email Identity</p>
                <p className="text-sm font-semibold text-[#d8d9da]">{profile.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[#8e8e8e] uppercase font-bold">Contact / Location</p>
                <div className="flex items-center gap-3 text-sm font-semibold text-[#d8d9da]">
                   <span className="flex items-center gap-1"><Phone size={12} className="text-[#8e8e8e]"/> {profile.tel}</span>
                   <span className="flex items-center gap-1"><Globe2 size={12} className="text-[#8e8e8e]"/> {profile.country}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[#8e8e8e] uppercase font-bold">Launched At</p>
                <p className="text-sm font-mono text-[#73bf69]">{new Date(profile.launchedAt).toLocaleString()}</p>
              </div>
            </div>
          )) : <p className="text-xs text-[#8e8e8e] italic">No verified operator profile detected.</p>}
        </CardContent>
      </Card>

      {/* System Integrity Check Configuration */}
      <Card className="bg-[#2d2d2d] border-[#404040] shadow-none">
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-sm uppercase tracking-wider text-[#d8d9da] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#73bf69]" />
                System Integrity Watchdog
              </CardTitle>
              <CardDescription className="text-[10px] text-[#8e8e8e]">
                Set the minimum benchmark percentage required to maintain a "Nominal" state.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs font-mono text-[#73bf69] font-bold">{integrityThreshold}%</span>
               <input 
                type="range" min="0" max="100" 
                value={integrityThreshold} 
                onChange={(e) => updateThreshold(e.target.value)}
                className="w-32 accent-[#73bf69]"
               />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Advanced Identity Masking */}
      <Card className="bg-[#2d2d2d] border-[#404040] border-l-4 border-l-[#5794f2] shadow-none">
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-sm uppercase tracking-wider text-[#d8d9da] flex items-center gap-2">
                <Ghost className="w-4 h-4 text-[#5794f2]" />
                Ghost Mode (White-Labeling)
              </CardTitle>
              <CardDescription className="text-[10px] text-[#8e8e8e]">
                Completely mask internal system references and AI identification for stealth operations.
              </CardDescription>
            </div>
            <button 
              onClick={() => toggleGhostMode(!ghostMode)}
              className={`h-6 w-11 rounded-full transition-colors relative ${ghostMode ? 'bg-[#73bf69]' : 'bg-[#404040]'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${ghostMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-[#2d2d2d] border-[#404040] shadow-none">
        <CardHeader className="border-b border-[#404040]">
          <CardTitle className="text-sm uppercase tracking-wider text-[#8e8e8e] flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5794f2]" />
              Elite Deployment Registry
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="w-3 h-3 text-[#8e8e8e]" /></TooltipTrigger>
                  <TooltipContent className="text-[10px]">Cryptographic ledger of BSS-28 policy shifts and manual syncs.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
          <CardDescription className="text-[10px] text-[#8e8e8e] mt-1">Cryptographic audit log of all system state transitions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-[#5794f2]" /></div>
          ) : (
            <DeploymentRegistryTable data={registryData} />
          )}
        </CardContent>
      </Card>

      {/* System Logs Stream */}
      <Card className="bg-[#1e1e1e] border-[#404040] shadow-none flex flex-col h-[400px]">
        <CardHeader className="border-b border-[#404040] py-3 bg-[#2d2d2d]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e] flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#73bf69]" />
              Live System Telemetry Stream
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#73bf69] animate-pulse" />
              <span className="text-[10px] font-bold text-[#73bf69] uppercase">Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 font-mono text-[11px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#404040] flex-1">
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-[#2d2d2d]/50 py-0.5 transition-colors border-l-2 border-transparent hover:border-[#5794f2] pl-1">
                <span className="text-[#8e8e8e] shrink-0 tabular-nums">[{log.time}]</span>
                <span className={`font-black shrink-0 w-10 ${
                  log.type === 'WARN' ? 'text-[#f2cc0c]' : 
                  log.type === 'ERROR' ? 'text-[#e02f44]' : 'text-[#5794f2]'
                }`}>
                  {log.type}
                </span>
                <span className="text-[#d8d9da] break-all leading-relaxed tabular-nums">{log.msg}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
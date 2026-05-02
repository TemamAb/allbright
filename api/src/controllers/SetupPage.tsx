import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Zap, Globe, Key, HelpCircle, UserPlus, LogIn, Type, Image as ImageIcon, Upload, Loader2, Rocket, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

declare global {
  interface Window {
    electronAPI: {
      saveOnboarding: (config: any) => Promise<{ success: boolean }>;
      encrypt: (text: string) => Promise<string>;
      decrypt: (encrypted: string) => Promise<string>;
    };
  }
}

export const SetupPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    name: '',
    tel: '',
    country: '',
  });
  const [branding, setBranding] = useState({
    appName: '',
    logoUrl: '',
  });
  const [verifyToken, setVerifyToken] = useState('');
  const [config, setConfig] = useState({
    rpcEndpoint: '',
    pimlicoKey: '',
    privateKey: '',
  });
  const [jwtSecret, setJwtSecret] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copilotInsight, setCopilotInsight] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  const generateJwtSecret = async () => {
    try {
      const res = await fetch('/api/setup/generate-secret');
      const data = await res.json();
      if (data.success) {
        setJwtSecret(data.secret);
        toast.success("Secure JWT Secret generated locally.");
      }
    } catch (e) {
      toast.error("Failed to generate secret");
    }
  };

  const consultCopilot = async (field: string, value: string) => {
    if (!value || value.length < 5) return;
    setIsConsulting(true);
    setCopilotInsight(null);
    try {
      const res = await fetch('/api/setup/copilot-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });
      const data = await res.json();
      if (data.success) {
        setCopilotInsight(data.advice);
      }
    } catch (e) { /* Silent fail */ }
    finally { setIsConsulting(false); }
  };

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      toast.error("Please enter dashboard credentials");
      return;
    }

    setLoading(true);
    try {
      // Using the local API path
      const response = await fetch('/api/setup/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('bs_auth_token', data.token); // Secure token storage
        setIsLoggedIn(true);
        toast.success("Identity verified");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data.success) {
        setIsVerifying(true);
        toast.success("Account created. Check your license for verification token.");
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken })
      });
      const data = await res.json();
      if (data.success) {
        setIsVerifying(false);
        setIsRegistering(false);
        toast.success("Verification complete. You may now login.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBranding = async () => {
    try {
      const res = await fetch('/api/setup/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Identity updated successfully");
      }
    } catch (e) {
      toast.error("Failed to update branding");
    }
  };

  const handleEnvFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const res = await fetch('/api/setup/upload-env', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ envContent: content })
        });
        const data = await res.json();
        if (data.success && data.config?.trading) {
          toast.success("Environment detected and auto-populated");
          setConfig({
            rpcEndpoint: data.config.trading.rpc || config.rpcEndpoint,
            pimlicoKey: data.config.trading.pimlicoKey || config.pimlicoKey,
            privateKey: data.config.trading.privateKey || config.privateKey,
          });
        } else if (data.error) {
          toast.error(`Import failed: ${data.error}`);
        }
      } catch (err) { toast.error("Failed to parse configuration file"); }
      finally { setIsUploading(false); }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!config.rpcEndpoint || !config.pimlicoKey || !config.privateKey) {
      toast.error("Please fill in all elite-grade credentials");
      return;
    }

    const aiKey = config.privateKey; // Logic assumes AI key entered in setup or retrieved from env

    setLoading(true);
    try {
      // BSS-52: Execute Cognitive Handshake
      const handshakeRes = await fetch('/api/setup/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY })
      });
      
      const handshakeData = await handshakeRes.json();
      if (!handshakeData.success) {
        toast.error(`Handshake failed: ${handshakeData.error}. Please check your AI API keys.`);
        setLoading(false);
        return;
      }

      // Recommendation 1: Hardware Encryption before bridge transit
      const securePK = await window.electronAPI.encrypt(config.privateKey);
      const result = await window.electronAPI.saveOnboarding({ ...config, privateKey: securePK });
      
      if (result.success) {
        // BSS-52 Point of Departure: Warm Announcement
        setIsLaunching(true);
        toast.success(`${branding.appName || 'BrightSky'} is now LIVE and under your command.`);
        
        // Trigger backend telemetry for the bubble
        fetch('/api/debug/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'ConfirmOptimization', kpiCategory: 'WELCOME_MISSION' })
        });

        // Final transition to the Operator Dashboard
        setTimeout(() => {
          window.location.hash = '#/';
        }, 4500);
      }
    } catch (error: any) {
      toast.error(`Onboarding failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isLaunching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#111217] space-y-8 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-[#73bf69] blur-3xl opacity-20 animate-pulse" />
          <Rocket className="w-24 h-24 text-[#73bf69] relative animate-bounce" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-[#d8d9da] tracking-tighter uppercase italic">
            Launching <span className="text-[#73bf69]">{branding.appName || 'BrightSky'}</span>
          </h1>
          <p className="text-[#8e8e8e] font-mono text-sm max-w-md mx-auto leading-relaxed">
            Cognitive transition complete. Alpha-Copilot is now listening to your private intelligence endpoint. 
            Elite Arbitrage systems are initializing...
          </p>
        </div>
        <div className="w-64 h-1 bg-[#2d2d2d] rounded-full overflow-hidden">
          <div className="h-full bg-[#73bf69] animate-[progress_4s_ease-in-out]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] p-6 font-sans">
      <Card className="w-full max-w-2xl border-[#404040] bg-[#2d2d2d] rounded-lg shadow-none">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            {isLoggedIn && branding.logoUrl ? (
              <div className="w-8 h-8 rounded bg-[#1e1e1e] flex items-center justify-center overflow-hidden border border-[#404040]">
                <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 mr-2">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
            )}
            {!isLoggedIn && (
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-white leading-none">BRIGHT<span className="text-cyan-500">SKY</span></span>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black">DeFi Software Developer Ltd.</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold tracking-tight text-[#d8d9da]">
              {isLoggedIn 
                ? (branding.appName ? branding.appName.toUpperCase() : "Elite Configuration") 
                : isVerifying ? "Account Verification" : isRegistering ? "Commercial Registration" : "Dashboard Access"}
            </CardTitle>
          </div>
          <CardDescription className="text-[#8e8e8e]">
            {isLoggedIn 
              ? "Configure your elite-grade arbitrage parameters. These keys will be encrypted and stored locally."
              : "Please verify your identity to access the BrightSky dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoggedIn && (
            <div className="space-y-4 border-b border-[#404040] pb-6 mb-6">
              <div className="flex items-center gap-2 text-[#73bf69] text-xs font-bold uppercase tracking-widest">
                <Type className="w-3 h-3" /> White-Labeling & Branding (Optional)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#8e8e8e]">Custom App Name</Label>
                  <Input 
                    placeholder="e.g. MyAlgoBot" 
                    value={branding.appName}
                    onChange={(e) => setBranding({...branding, appName: e.target.value})}
                    onBlur={() => consultCopilot('branding', branding.appName)}
                    className="bg-[#1e1e1e] border-[#404040] h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-[#8e8e8e]">Custom Logo URL</Label>
                  <Input 
                    placeholder="https://..." 
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({...branding, logoUrl: e.target.value})}
                    className="bg-[#1e1e1e] border-[#404040] h-9 text-xs"
                  />
                </div>
              </div>
              <Button onClick={handleBranding} variant="outline" className="w-full h-8 text-[10px] border-[#404040] uppercase font-bold">Apply Branding</Button>
            </div>
          )}

          {isLoggedIn && !config.rpcEndpoint && (
            <div className="space-y-4 border-b border-[#404040] pb-6 mb-6">
              <div className="flex items-center gap-2 text-[#f2cc0c] text-xs font-bold uppercase tracking-widest">
                <Key className="w-3 h-3" /> Security Initialization
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-[#8e8e8e]">Master Session Secret (JWT_SECRET)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Click generate for a secure secret..." 
                    value={jwtSecret}
                    readOnly
                    className="bg-[#1e1e1e] border-[#404040] h-9 text-[10px] font-mono"
                  />
                  <Button onClick={generateJwtSecret} variant="outline" className="h-9 border-[#404040] shrink-0">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-[9px] text-[#8e8e8e]">Required for signing your local and cloud dashboard sessions.</p>
              </div>
            </div>
          )}

          {isLoggedIn && !config.rpcEndpoint && (
            <div className="space-y-4 border-b border-[#404040] pb-6 mb-6">
              <div className="flex items-center gap-2 text-[#5794f2] text-xs font-bold uppercase tracking-widest">
                <Upload className="w-3 h-3" /> Configuration Import
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] uppercase text-[#8e8e8e]">Quick Import .env File</Label>
                <Input 
                  type="file" 
                  accept=".env"
                  onChange={handleEnvFileUpload}
                  disabled={isUploading}
                  className="bg-[#1e1e1e] border-[#404040] h-10 text-xs cursor-pointer file:bg-[#2d2d2d] file:text-[#d8d9da] file:border-none file:h-full file:mr-4 file:px-4 file:text-[10px] file:uppercase file:font-bold"
                />
              </div>
            </div>
          )}

          {!isLoggedIn ? (
            <div className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Full Name</Label>
                    <Input 
                      placeholder="John Doe" 
                      value={credentials.name}
                      onChange={(e) => setCredentials({ ...credentials, name: e.target.value })}
                      className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Telephone</Label>
                      <Input 
                        placeholder="+1..." 
                        value={credentials.tel}
                        onChange={(e) => setCredentials({ ...credentials, tel: e.target.value })}
                        className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Country</Label>
                      <Input 
                        placeholder="United Kingdom" 
                        value={credentials.country}
                        onChange={(e) => setCredentials({ ...credentials, country: e.target.value })}
                        className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="iamtemam@gmail.com" 
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••" 
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                />
              </div>
              <Button 
                className="w-full h-12 text-lg font-bold bg-[#73bf69] hover:bg-[#5da053] text-white transition-colors" 
                disabled={loading}
                onClick={isRegistering ? handleRegister : handleLogin}
              >
                {loading ? "Processing..." : isRegistering ? "Create Account" : "Enter Dashboard"}
              </Button>
              <div className="text-center">
                <button 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-[#5794f2] hover:underline uppercase font-bold"
                >
                  {isRegistering ? "Already have an account? Login" : "First time operator? Register"}
                </button>
              </div>
            </div>
          ) : isVerifying ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#d8d9da] text-xs uppercase tracking-wider font-bold">Verification Token</Label>
                <Input 
                  placeholder="Paste token here..." 
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da]"
                />
              </div>
              <Button 
                className="w-full h-12 bg-[#5794f2] text-white font-bold"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm Verification"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-[#d8d9da]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rpc" className="flex items-center space-x-2 text-[#d8d9da] text-xs uppercase tracking-wider font-bold">
                    <Globe className="w-4 h-4" /> <span>RPC Endpoint</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="w-3 h-3 text-[#8e8e8e]" /></TooltipTrigger>
                      <TooltipContent className="text-[10px] max-w-[200px]">Elite performance requires &lt;15ms latency. Use Alchemy or Quicknode Private Endpoints.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input 
                  id="rpc" 
                  placeholder="https://base-mainnet.g.alchemy.com/v2/..." 
                  value={config.rpcEndpoint}
                  onChange={(e) => setConfig({ ...config, rpcEndpoint: e.target.value })}
                  onBlur={() => consultCopilot('rpc', config.rpcEndpoint)}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da] font-mono tabular-nums"
                />
                <p className="text-xs text-[#8e8e8e]">High-performance private RPC recommended for &lt;15ms latency.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pimlico" className="flex items-center space-x-2 text-[#d8d9da] text-xs uppercase tracking-wider font-bold">
                  <Zap className="w-4 h-4" /> <span>Pimlico API Key</span>
                </Label>
                <Input 
                  id="pimlico" 
                  placeholder="pm_..." 
                  value={config.pimlicoKey}
                  onChange={(e) => setConfig({ ...config, pimlicoKey: e.target.value })}
                  onBlur={() => consultCopilot('pimlico', config.pimlicoKey)}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da] font-mono"
                />
                <p className="text-xs text-[#8e8e8e]">Required for gasless UserOperation sponsorship.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pk" className="flex items-center space-x-2 text-[#d8d9da] text-xs uppercase tracking-wider font-bold">
                  <Key className="w-4 h-4" /> <span>Private Key</span>
                </Label>
                <Input 
                  id="pk" 
                  type="password"
                  placeholder="0x..." 
                  value={config.privateKey}
                  onChange={(e) => setConfig({ ...config, privateKey: e.target.value })}
                  className="bg-[#1e1e1e] border-[#404040] text-[#d8d9da] font-mono"
                />
                <p className="text-xs text-destructive/80 italic">Never shared with third parties. Encrypted locally with AES-256-GCM.</p>
              </div>

              {(isConsulting || copilotInsight) && (
                <div className="p-3 bg-[#5794f2]/5 border border-[#5794f2]/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-6 h-6 rounded-full bg-[#5794f2]/20 flex items-center justify-center shrink-0">
                    {isConsulting ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#5794f2] animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#5794f2]" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-[#5794f2] uppercase tracking-[0.15em]">Alpha-Copilot Insight</p>
                      {!isConsulting && (
                        <button onClick={() => setCopilotInsight(null)} className="text-[#8e8e8e] hover:text-[#d8d9da] transition-colors">
                          <HelpCircle className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    {isConsulting ? (
                      <div className="space-y-1.5">
                        <div className="h-2 bg-[#5794f2]/10 rounded animate-pulse w-[90%]" />
                        <div className="h-2 bg-[#5794f2]/10 rounded animate-pulse w-[75%]" />
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#d8d9da] leading-relaxed italic font-medium">"{copilotInsight}"</p>
                    )}
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg font-bold transition-all hover:scale-[1.01] bg-[#73bf69] hover:bg-[#5da053] text-white" 
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? "Validating & Encrypting..." : "Finalize Elite Configuration"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
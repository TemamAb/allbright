import { useEffect, useState } from 'react';
import { useSocket } from '../App';
import { toast } from 'sonner';
import { Bot, RefreshCcw, Upload, Loader2, Terminal, Zap, FileText, ShieldCheck, Copy } from 'lucide-react';

/**
 * BSS-56: Setup Wizard Component
 * Manages the "Zero-Config" cloud setup and listens for Copilot confirmation events.
 */
export default function SetupWizard() {
  const { socket } = useSocket();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'deploying' | 'complete' | 'error'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isConfigurationHardened, setIsConfigurationHardened] = useState(false); // New state for hardening

  const handleAutoFix = async () => {
    if (!serviceId) return;
    setIsFixing(true);
    try {
      const res = await fetch('/api/setup/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });
      const data = await res.json();
      if (data.success) {
        // BSS-56: If AI provides advice, display it
        if (data.advice) setAiAdvice(data.advice);

        setAiAdvice(data.advice);
        toast.success('AI Remediation Dispatched', { description: 'Alpha-Copilot is attempting to fix and redeploy.' });
      }
    } catch (e) {
      toast.error('Remediation failed');
    } finally {
      setIsFixing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.env')) {
      toast.error('Invalid file type', { description: 'Please provide a valid .env configuration file.' });
      return;
    }

    setIsUploading(true);
    setStatus('syncing');
    setProgress(10);
    setAiAdvice(null); // Clear previous advice
    setIsConfigurationHardened(false); // Reset hardened status

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
        
        if (data.success) {
          if (data.serviceId) setServiceId(data.serviceId);
          toast.success('Environment Uploaded', { description: 'Handing off to Alpha-Copilot for cloud synchronization...' });
        } else {
          toast.error('Upload Failed', { description: data.error });
          setStatus('error');
        }
      } catch (err) {
        toast.error('Bridge Error', { description: 'Failed to communicate with setup controller.' });
        setStatus('error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleRetry = async () => {
    try {
      await fetch('/api/setup/cancel-sync', { method: 'POST' });
    } catch (e) { /* Silent fail */ }

    setStatus('idle');
    setProgress(0);
    setAiAdvice(null);
    setIsConfigurationHardened(false);
    toast.info('Deployment reset', { description: 'Please re-upload your .env file to restart the sequence.' });
  };

  useEffect(() => {
    if (!socket) return;

    // BSS-56: Listener for the 'cloud-sync-success' event broadcast by the backend
    // This provides visual confirmation when the Alpha-Copilot successfully syncs the .env to Render
    const handleCopilotEvent = (payload: { type: string; data: any }) => {
      if (payload.type === 'cloud-sync-success') {
        toast.success('Cognitive Confirmation', {
          description: payload.data.message,
          icon: <Bot className="w-4 h-4 text-emerald-500" />,
          duration: 8000,
        });
        setStatus('deploying');
        setProgress(20); // Initial jump after sync success
        setAiAdvice(null); // Reset advice on new deployment attempt
      }

      // BSS-56: Support for real-time progress updates from the CloudOrchestrator
      if (payload.type === 'cloud-deploy-progress') {
        const { percentage, status: newStatus, message } = payload.data;
        setProgress(percentage);
        if (newStatus) setStatus(newStatus);
        if (message) setAiAdvice(message); // Capture AI analysis from stream

        if (percentage === 100) {
          setStatus('complete');
        }
      }

      // BSS-56: Handle onboarding timeout event
      if (payload.type === 'onboarding-timeout') {
        toast.error('Deployment Timeout', { description: payload.data.message });
        setStatus('error');
        setAiAdvice('The onboarding sequence timed out. Analysis suggests checking Render logs for persistent environment drift or network congestion.');
      }

      // BSS-56: Listen for configuration hardened event
      if (payload.type === 'config-hardened') {
        setIsConfigurationHardened(true);
        toast.success('Configuration Hardened', {
          description: payload.data.message,
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
          duration: 10000,
        });
        setAiAdvice(payload.data.analysis); // Display AI's explanation of hardening
      }
    };

    socket.on('copilot_event', handleCopilotEvent);

    return () => {
      socket.off('copilot_event', handleCopilotEvent);
    };
  }, [socket]);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="bg-[#111217] border border-zinc-800/50 rounded-xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -mr-16 -mt-16" />
        <div className="flex flex-col gap-2 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center mr-1">
              <Zap className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tighter uppercase text-white leading-none">BRIGHT<span className="text-cyan-500">SKY</span></h1>
              <p className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">allbright DeFi Software Developer Ltd.</p>
            </div>
          </div>
          <div className="h-px w-full bg-zinc-800/50 my-2" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80">Production Onboarding Sequence</h2>
        </div>
        <div className="space-y-4">
          <p className="text-zinc-400 text-[13px] leading-relaxed font-medium">
            The Setup Wizard is currently active. Uploading your <code className="text-primary">.env</code> file 
            triggers a Zero-Config deployment sequence. Alpha-Copilot will notify you once 
            the cloud provider has been updated via the Render API.
          </p>

          {status === 'idle' && (
            <div 
              className="relative group mt-8 border-2 border-dashed border-zinc-800 rounded-xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => document.getElementById('env-upload-input')?.click()}
            >
              <input 
                type="file" 
                id="env-upload-input" 
                className="hidden" 
                accept=".env"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {isUploading ? <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /> : <Upload className="w-10 h-10 text-zinc-600 group-hover:text-emerald-500 transition-colors" />}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                    <Zap className="w-3 h-3 text-cyan-500" />
                  </div>
                  <p className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">Drop .env configuration</p>
                </div>
                <p className="text-[9px] text-zinc-500 mt-2 uppercase font-bold tracking-widest">or click to browse local storage</p>
              </div>
            </div>
          )}

          {(progress > 0 || status !== 'idle') && (
            <div className="mt-8 space-y-3 animate-in slide-in-from-bottom-2 duration-700">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500">Cloud Status: <span className="text-emerald-500">{status}</span></span>
                <span className="text-zinc-400 tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[9px] text-zinc-600 italic">
                {status === 'syncing' ? 'Synchronizing environment secrets...' : 
                 status === 'deploying' ? 'Render is performing a rolling update...' : 
                 status === 'error' ? 'Critical Error: Cloud deployment synchronization failed.' :
                 'Elite deployment successful.'}
              </p>

              {serviceId && (status === 'deploying' || status === 'error' || status === 'complete') && (
                <button 
                  onClick={() => window.open(`https://dashboard.render.com/services/${serviceId}/logs`, '_blank')}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-black/40 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded-lg hover:bg-zinc-800/50 transition-all group"
                >
                  <Terminal className="w-3 h-3 group-hover:text-emerald-500 transition-colors" />
                  Open Deployment Console
                </button>
              )}

              {aiAdvice && (
                <div className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex-1">Alpha-Copilot Analysis</span>
                    <button 
                      onClick={() => { 
                        if (aiAdvice) navigator.clipboard.writeText(aiAdvice); 
                        toast.success('Analysis copied'); 
                      }}
                      className="p-1 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3 text-zinc-500" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-medium italic">
                    "{aiAdvice}"
                  </p>
                </div>
              )}

              {isConfigurationHardened && ( // New badge for hardened status
                <div className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[10px] font-black uppercase rounded-lg">
                  <ShieldCheck className="w-3 h-3" />
                  Configuration Sentinel Active
                </div>
              )}

              {status === 'error' && (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={handleAutoFix}
                    disabled={isFixing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-500/20 transition-all group disabled:opacity-50"
                  >
                    {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Auto-Fix with Alpha-Copilot
                  </button>
                  <button 
                    onClick={handleRetry}
                    className="px-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase rounded-lg hover:bg-zinc-800 transition-all group"
                  >
                    <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

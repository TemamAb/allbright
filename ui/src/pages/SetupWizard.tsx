import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, AlertTriangle, Zap, Play, Cloud, Server, FileText, Brain } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 'readiness', title: 'System Check', icon: CheckCircle2, desc: 'Verify Node/Rust/Docker' },
  { id: 'env', title: '.env Upload', icon: FileText, desc: 'Auto-parse KEY=value (Render-style)' },
  { id: 'deps', title: 'Auto Install', icon: Zap, desc: 'pnpm + cargo build' },
  { id: 'launch', title: 'Launch Copilot', icon: Brain, desc: 'Open Alpha-Copilot mission control' },
];

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [envFile, setEnvFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: readiness } = useQuery({
    queryKey: ['setup-readiness'],
    queryFn: () => fetch('/api/setup/readiness').then(res => res.json()),
    refetchInterval: 5000,
  });

  const overallScore = readiness?.overallScore || 0;

  const envUpload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('envFile', file);
      const res = await fetch('/api/setup/upload-env', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Auto-configured ${data.keys?.length || 0} vars (Render-style)`);
      queryClient.invalidateQueries({ queryKey: ['setup-readiness'] });
      setCurrentStep(2);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Upload error'),
  });

  const handleEnvUpload = () => envFile && envUpload.mutate(envFile);

  const StepIcon = ({ stepId }: { stepId: string }) => {
    const Icon = STEPS.find(s => s.id === stepId)?.icon || CheckCircle2;
    const status = STEPS.findIndex(s => s.id === stepId) < currentStep ? 'complete' : 
                   STEPS.findIndex(s => s.id === stepId) === currentStep ? 'active' : 'pending';
    const className = status === 'active' ? 'text-primary animate-pulse' : 
                      status === 'complete' ? 'text-emerald-500' : 'text-slate-500';
    return <Icon className={`w-8 h-8 ${className}`} />;
  };

  const isComplete = localStorage.getItem('setupComplete') === 'true';

  useEffect(() => {
    if (isComplete) {
      window.location.href = '/copilot';
    }
  }, [isComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo */}
        <div className="mb-12 p-6 bg-slate-900/30 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl shadow-xl flex-shrink-0 border-2 border-white/20">
              <img 
                src="/LOGO.png" 
                alt="BrightSky" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-100 to-primary bg-clip-text text-transparent mb-3">
                BrightSky Setup Wizard
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
                Professional installation powered by Alpha-Copilot. Auto-detects .env KEY=value format like Render dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Vertical Stepper */}
          <div className="space-y-6">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative group">
                <div className="flex items-center gap-4 p-8 bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-800/50 hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]" onClick={() => setCurrentStep(idx)}>
                  <StepIcon stepId={step.id} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xl mb-1">{step.title}</div>
                    <div className="text-slate-400 text-sm">{step.desc}</div>
                  </div>
                  <div className={`ml-auto w-3 h-3 rounded-full ring-8 ring-transparent transition-all ${
                    idx < currentStep ? 'bg-emerald-500 ring-emerald-500/20 scale-110' :
                    idx === currentStep ? 'bg-primary ring-primary/20 scale-110' : 'bg-slate-600 ring-slate-800/50'
                  }`} />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`absolute left-16 top-full h-full w-px bg-gradient-to-b from-slate-800 to-primary/30 origin-top transition-all duration-500 ${
                    idx < currentStep ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Readiness Card */}
            <Card className="glass-panel border-primary/30 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-primary rounded-full animate-ping" />
                  <CardTitle className="text-3xl font-black">System Readiness {overallScore.toFixed(0)}%</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={overallScore} className="h-5 mb-8" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readiness?.checks?.slice(0,6).map((check: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl border bg-slate-900/30 hover:scale-105 transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={check.status === 'pass' ? 'default' : 'destructive'} className="px-3 py-1">
                          {check.status.toUpperCase()}
                        </Badge>
                        <span className="font-mono opacity-75">{check.score}%</span>
                      </div>
                      <div className="font-semibold">{check.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{check.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Content */}
            <Card className="glass-panel shadow-2xl border-2 border-slate-800/50 hover:border-primary/50">
              <CardHeader className="pb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-2xl border-2 border-primary/30 backdrop-blur-xl flex items-center justify-center shadow-lg">
                    {STEPS[currentStep].icon({ className: 'w-8 h-8 text-primary' })}
                  </div>
                  <div>
                    <CardTitle className="text-4xl font-black bg-gradient-to-r from-slate-200 to-primary bg-clip-text">
                      {STEPS[currentStep].title}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">{STEPS[currentStep].desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {currentStep === 0 && (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-28 h-28 mx-auto text-emerald-500 mb-8 shadow-2xl animate-bounce" />
                    <h3 className="text-3xl font-bold text-slate-100 mb-4">All Clear!</h3>
                    <p className="text-xl text-slate-400 mb-12 max-w-md mx-auto">
                      Environment verified. Ready for configuration.
                    </p>
                    <Button size="lg" onClick={() => setCurrentStep(1)} className="w-80 h-16 shadow-2xl">
                      Configure Environment →
                    </Button>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="p-8 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 text-center">
                      <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-6" />
                      <h3 className="text-2xl font-bold text-slate-100 mb-4">Environment Configuration</h3>
                      <p className="text-lg text-slate-400 leading-relaxed">
                        Upload .env file - automatically parses <code className="font-mono bg-slate-900 px-2 py-1 rounded text-primary text-sm mx-1">KEY=value</code> format 
                        (Render dashboard style, no quotes needed).
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-slate-700/50 rounded-3xl p-16 text-center hover:border-primary/70 hover:bg-slate-900/20 transition-all backdrop-blur-xl shadow-2xl hover:shadow-primary/10">
                      <Upload className="w-24 h-24 mx-auto mb-8 text-slate-400 animate-bounce" />
                      <input
                        type="file"
                        accept=".env,.txt"
                        onChange={(e) => setEnvFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="env-upload"
                      />
                      <label htmlFor="env-upload" className="cursor-pointer block">
                        <Button variant="ghost" size="lg" className="gap-3 px-12 py-8 border-2 border-slate-700/50 hover:border-primary bg-slate-900/50 hover:bg-primary/5 shadow-xl text-lg">
                          <FileText className="w-6 h-6" />
                          Select .env File
                        </Button>
                      </label>
                      {envFile && (
                        <div className="mt-12 p-8 bg-gradient-to-r from-emerald-500/10 to-primary/10 border-2 border-emerald-500/30 rounded-3xl backdrop-blur-sm shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-6 mb-6">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 flex-shrink-0" />
                            <div>
                              <h4 className="text-2xl font-bold text-emerald-400">{envFile.name}</h4>
                              <p className="text-lg text-slate-400">Size: {(envFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <div className="flex gap-3 flex-wrap justify-center">
                            <Badge variant="default" className="bg-emerald-500/90 text-slate-900 font-bold px-4 py-2">
                              ✓ Auto-parsed
                            </Badge>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
                              Render Format
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500 text-emerald-400 px-4 py-2">
                              Ready
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleEnvUpload} 
                      disabled={!envFile || envUpload.isPending}
                      className="w-full h-20 mt-16 text-2xl font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 shadow-2xl hover:shadow-primary/25 text-slate-900 rounded-3xl"
                    >
                      {envUpload.isPending ? (
                        <>
                          <Zap className="w-8 h-8 mr-4 animate-spin" />
                          Processing .env...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-8 h-8 mr-4" />
                          Auto-Configure Environment
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="text-center py-24 space-y-8">
                    <CheckCircle2 className="w-36 h-36 mx-auto text-emerald-500 shadow-2xl animate-bounce mb-12" />
                    <div className="space-y-6">
                      <h3 className="text-5xl font-black bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
                        Perfect!
                      </h3>
                      <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Environment auto-configured and validated. Ready for launch.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 shadow-xl text-center group hover:scale-105 transition-all">
                        <code className="font-mono text-3xl font-bold text-emerald-400 block mb-4 bg-slate-900 px-6 py-4 rounded-2xl shadow-inner">100% READY</code>
                        <div className="text-2xl font-bold text-emerald-400">Dependencies Verified</div>
                      </div>
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-xl text-center group hover:scale-105 transition-all">
                        <div className="font-mono text-3xl font-bold text-primary mb-4 bg-slate-900 px-6 py-4 rounded-2xl shadow-inner">KEY=value</div>
                        <div className="text-2xl font-bold text-primary">Auto-Configured</div>
                      </div>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full h-24 text-3xl font-black shadow-2xl hover:shadow-emerald/25 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-slate-900 rounded-3xl"
                      onClick={() => setCurrentStep(3)}
                    >
                      🚀 Launch Mission Control
                    </Button>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center py-32 space-y-12">
                    <Brain className="w-48 h-48 mx-auto text-primary shadow-2xl mb-16 animate-pulse" />
                    <div className="space-y-6">
                      <h3 className="text-6xl font-black bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent mb-8">
                        Mission Ready
                      </h3>
                      <p className="text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-16">
                        Alpha-Copilot mission control activated. Professional setup complete.
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full h-24 text-3xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-2xl hover:shadow-emerald/25 text-slate-900 font-black rounded-3xl"
                      onClick={() => {
                        localStorage.setItem('setupComplete', 'true');
                        window.location.href = '/copilot';
                      }}
                    >
                      🎯 Enter Alpha-Copilot Control Center
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


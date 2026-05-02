import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CloudProvider {
  id: string;
  name: string;
  description: string;
  isSupported: boolean;
}

export const CloudSelectionModal: React.FC = () => {
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const result = await (window as any).electronAPI.getCloudProviders();
        if (result.success) {
          setProviders(result.providers);
        } else {
          toast.error(result.error || "Failed to load cloud providers");
        }
      } catch (err) {
        toast.error("Bridge connection failed");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleDeploy = async () => {
    if (!selectedProvider) return;

    setDeploying(true);
    try {
      const result = await (window as any).electronAPI.deployToCloud(selectedProvider);
      if (result.success) {
        toast.success(`Deployment initiated! ID: ${result.deploymentId}`);
      } else {
        toast.error(result.error || "Deployment failed");
      }
    } catch (err) {
      toast.error("Deployment request failed");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-[#404040] bg-[#2d2d2d] hover:bg-[#404040] text-[#d8d9da]">
          <Cloud className="w-4 h-4 text-[#5794f2]" />
          Deploy to Cloud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#1e1e1e] border-[#404040] text-[#d8d9da]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#73bf69]">
            <Cloud className="text-[#5794f2]" />
            Select Cloud Provider
          </DialogTitle>
          <DialogDescription>
            Transition your local BrightSky engine to a professional cloud environment with one click.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#5794f2]" />
            </div>
          ) : (
            providers.map((provider) => (
              <Card 
                key={provider.id}
                className={`cursor-pointer transition-all border ${
                  selectedProvider === provider.id 
                    ? 'border-[#5794f2] bg-[#5794f2]/10' 
                    : 'border-[#404040] bg-[#2d2d2d] hover:border-[#5794f2]/50'
                } ${!provider.isSupported && 'opacity-60 cursor-not-allowed'}`}
                onClick={() => provider.isSupported && setSelectedProvider(provider.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#d8d9da]">{provider.name}</span>
                      {provider.isSupported ? (
                        <Badge variant="secondary" className="bg-[#73bf69] text-white text-[10px]">Elite Supported</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#8e8e8e]">{provider.description}</p>
                  </div>
                  {selectedProvider === provider.id && (
                    <CheckCircle2 className="text-[#5794f2] w-5 h-5 shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            disabled={!selectedProvider || deploying} 
            onClick={handleDeploy}
            className="w-full h-11 bg-[#73bf69] hover:bg-[#5da053] text-white font-bold"
          >
            {deploying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing Elite Config...
              </span>
            ) : (
              "Confirm & Deploy"
            )}
          </Button>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center uppercase tracking-widest font-semibold">
            <AlertCircle className="w-3 h-3" />
            Full DRR Gate Check will be enforced
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
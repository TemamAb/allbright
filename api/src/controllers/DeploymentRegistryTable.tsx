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
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Terminal, Cloud } from "lucide-react";

interface DeploymentRecord {
  id: number;
  commitHash: string;
  commitMessage: string;
  cloudProvider: string;
  timestamp: string | Date;
  smartAccount: string;
  contractAddress: string;
  isActive: boolean;
  triggeredBy: 'USER' | 'ALPHA_COPILOT';
}

interface DeploymentRegistryTableProps {
  data: DeploymentRecord[];
}

/**
 * BSS-56: Elite Deployment Registry Ledger
 * Visualizes the history of manual and AI-orchestrated cloud state transitions.
 */
export const DeploymentRegistryTable: React.FC<DeploymentRegistryTableProps> = ({ data }) => {
  return (
    <div className="rounded-lg border border-[#404040] bg-[#1e1e1e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#2d2d2d]">
          <TableRow className="border-[#404040] hover:bg-transparent">
            <TableHead className="w-[50px] text-[#8e8e8e] font-bold text-[10px] uppercase">#</TableHead>
            <TableHead className="text-[#8e8e8e] font-bold text-[10px] uppercase">Cloud</TableHead>
            <TableHead className="text-[#8e8e8e] font-bold text-[10px] uppercase">Version / Commit</TableHead>
            <TableHead className="text-[#8e8e8e] font-bold text-[10px] uppercase">Execution Context</TableHead>
            <TableHead className="text-[#8e8e8e] font-bold text-[10px] uppercase">Timestamp</TableHead>
            <TableHead className="text-[#8e8e8e] font-bold text-[10px] uppercase text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-[#8e8e8e] font-mono text-xs italic">
                System Registry Empty: No cloud sync records detected.
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, index) => (
              <TableRow key={record.id} className="border-[#404040] hover:bg-[#2d2d2d]/50 transition-colors">
                <TableCell className="font-mono text-[#5794f2] text-xs">{data.length - index}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3 h-3 text-[#5794f2]" />
                    <span className="text-[#d8d9da] font-bold text-xs">{record.cloudProvider}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#d8d9da] text-xs font-semibold truncate">{record.commitMessage}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="h-4 border-[#404040] text-[#8e8e8e] bg-black text-[9px] font-mono px-1">
                        {record.commitHash}
                      </Badge>
                      {record.triggeredBy === 'ALPHA_COPILOT' && (
                        <Badge className="h-4 bg-[#5794f2]/20 text-[#5794f2] border-none text-[8px] font-bold">AI OPTIMIZED</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-[10px] font-mono">
                    <span className="text-[#8e8e8e]">SA: {record.smartAccount.slice(0, 6)}...{record.smartAccount.slice(-4)}</span>
                    <span className="text-[#8e8e8e]">EX: {record.contractAddress.slice(0, 6)}...{record.contractAddress.slice(-4)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#8e8e8e] text-[10px] font-mono tabular-nums">
                  {new Date(record.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    {record.isActive ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#73bf69]/10 border border-[#73bf69]/30 text-[#73bf69]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-black tracking-tighter">LIVE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#404040]/10 border border-[#404040] text-[#8e8e8e]">
                        <XCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold tracking-tighter">STALE</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
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
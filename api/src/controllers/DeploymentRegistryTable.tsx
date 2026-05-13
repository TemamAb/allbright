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
import { CheckCircle2, XCircle, Cloud } from "lucide-react";

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

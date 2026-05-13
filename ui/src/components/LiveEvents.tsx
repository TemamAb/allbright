import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ExternalLink, Hash, Search, Filter, X, Code, Info, ChevronsUpDown, Zap } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const mockTrades = [
  { id: '1', time: '14:20:01', pair: 'WETH/USDC', profit: '+0.42 ETH', status: 'SUCCESS', hash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc' },
  { id: '2', time: '14:18:45', pair: 'WBTC/WETH', profit: '+1.12 ETH', status: 'SUCCESS', hash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
  { id: '3', time: '14:15:10', pair: 'LINK/WETH', profit: '0.00 ETH', status: 'REVERTED', hash: '0x7897897897897897897897897897897897897897897897897897897897897897' },
  { id: '4', time: '14:12:33', pair: 'UNI/WETH', profit: '+0.08 ETH', status: 'SUCCESS', hash: '0x0120120120120120120120120120120120120120120120120120120120120120' },
];

const LiveEvents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTrades = useMemo(() => {
    return mockTrades.filter((trade) => {
      const matchesSearch = 
        trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) || 
        trade.hash.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || trade.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Live Blockchain Events</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Elite Protocol Activity Stream</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-accent transition-colors" />
            <Input 
              placeholder="Search pair or hash..."
              className="bg-ash-black border-ash-border rounded-xl h-11 pl-10 pr-4 text-xs text-white focus:border-cyan-accent/50 w-full sm:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-ash-black border border-ash-border rounded-xl px-4 h-11">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select 
              className="bg-transparent text-[10px] font-black uppercase text-zinc-300 focus:outline-none cursor-pointer appearance-none tracking-widest"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL" className="bg-ash-black">ALL STATUS</option>
              <option value="SUCCESS" className="bg-ash-black text-emerald-accent">SUCCESS</option>
              <option value="REVERTED" className="bg-ash-black text-red-400">REVERTED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-ash-black border border-ash-border rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-accent/50 via-emerald-accent/50 to-transparent" />
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-b border-ash-border/50 hover:bg-transparent">
              <TableHead className="px-6 h-12 text-[10px] text-zinc-500 font-black uppercase tracking-widest">Time</TableHead>
              <TableHead className="px-6 h-12 text-[10px] text-zinc-500 font-black uppercase tracking-widest">Asset Pair</TableHead>
              <TableHead className="px-6 h-12 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">Profit (Net)</TableHead>
              <TableHead className="px-6 h-12 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="px-6 h-12 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow 
                key={trade.id} 
                className="border-b border-ash-border/20 hover:bg-white/[0.01] transition-colors group/row"
              >
                <TableCell className="px-6 py-4 font-mono text-[10px] text-zinc-500">{trade.time}</TableCell>
                <TableCell className="px-6 py-4 font-black text-white uppercase tracking-tighter text-sm italic">{trade.pair}</TableCell>
                <TableCell className={`px-6 py-4 text-right font-mono font-bold text-sm ${trade.status === 'SUCCESS' ? 'text-emerald-accent' : 'text-zinc-500'}`}>
                  {trade.profit}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge 
                    className={trade.status === 'SUCCESS' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded'
                    }
                  >
                    {trade.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2 text-zinc-600 group-hover/row:text-zinc-400 transition-colors text-[10px] font-mono">
                    {`${trade.hash.substring(0, 8)}...${trade.hash.substring(trade.hash.length - 6)}`}
                    <ExternalLink size={12} className="text-zinc-700" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredTrades.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Zap size={32} className="text-zinc-800" />
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No matching events in mempool buffer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveEvents;
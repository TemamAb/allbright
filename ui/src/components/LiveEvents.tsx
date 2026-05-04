import React, { useState, useMemo, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge'; // Assuming Badge is a UI component
import { ExternalLink, Hash, Search, Filter, X, Code, Info, ChevronsUpDown } from 'lucide-react';

// Mock data structure representing the tradesTable records
const mockTrades = [
  { id: '1', time: '14:20:01', pair: 'WETH/USDC', profit: '+0.42 ETH', gas: '0.012 ETH', status: 'SUCCESS', hash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc', inputData: '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000de0b6b3a7640000' },
  { id: '2', time: '14:18:45', pair: 'WBTC/WETH', profit: '+1.12 ETH', gas: '0.045 ETH', status: 'SUCCESS', hash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', inputData: '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0' },
  { id: '3', time: '14:15:10', pair: 'LINK/WETH', profit: '0.00 ETH', gas: '0.002 ETH', status: 'REVERTED', hash: '0x7897897897897897897897897897897897897897897897897897897897897897', inputData: '0xf305d719000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000002' },
  { id: '4', time: '14:12:33', pair: 'UNI/WETH', profit: '+0.08 ETH', gas: '0.008 ETH', status: 'SUCCESS', hash: '0x0120120120120120120120120120120120120120120120120120120120120120', inputData: '0x18cbafe500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080' },
];

type Trade = typeof mockTrades[0];

const LiveEvents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trade; direction: 'asc' | 'desc' } | null>(null);

  const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const socket = io(baseApiUrl);

    // WebSocket listener for real-time trade observations
    socket.on('copilot_event', (event) => {
      if (event.type === 'TRADE_OBSERVED') {
        const newTrade: Trade = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          pair: 'WETH/USDC', // Static placeholder
          profit: (event.data.profitEth >= 0 ? '+' : '') + event.data.profitEth.toFixed(4) + ' ETH',
          gas: '0.00 ETH',
          status: event.data.success ? 'SUCCESS' : 'REVERTED',
          hash: '0x' + Math.random().toString(16).slice(2, 12) + '...',
          inputData: '0x...'
        };
        
        setTrades(prev => [newTrade, ...prev].slice(0, 100)); // Keep last 100 events
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [baseApiUrl]);

  const filteredTrades = useMemo(() => {
    let items = trades.filter((trade) => {
      const matchesSearch = 
        trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) || 
        trade.hash.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || trade.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    return items;
  }, [searchQuery, statusFilter, trades]);

  const requestSort = (key: keyof Trade) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Live Blockchain Events</h2>
          <p className="text-zinc-500 font-medium mt-1">Real-time mempool activity and execution logs.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search pair or hash..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 w-full sm:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select 
              className="bg-transparent text-sm text-zinc-300 focus:outline-none cursor-pointer appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL" className="bg-zinc-900">All Status</option>
              <option value="SUCCESS" className="bg-zinc-900">Success</option>
              <option value="REVERTED" className="bg-zinc-900">Reverted</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="border-zinc-800 bg-black shadow-2xl">
        <CardHeader className="border-b border-zinc-900">
          <CardTitle className="text-lg font-bold text-zinc-300 flex items-center uppercase tracking-wider">
            <Hash className="mr-2 h-5 w-5 text-green-500" />
            Trade Execution Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-mono text-xs cursor-pointer" onClick={() => requestSort('time')}>TIMESTAMP <ChevronsUpDown size={10} className="inline"/></TableHead>
                <TableHead className="text-zinc-300 font-bold uppercase text-xs cursor-pointer" onClick={() => requestSort('pair')}>ASSET PAIR <ChevronsUpDown size={10} className="inline"/></TableHead>
                <TableHead className="text-zinc-300 font-bold uppercase text-xs text-right cursor-pointer" onClick={() => requestSort('profit')}>PROFIT (NET) <ChevronsUpDown size={10} className="inline"/></TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-xs text-right cursor-pointer" onClick={() => requestSort('gas')}>GAS COST <ChevronsUpDown size={10} className="inline"/></TableHead>
                <TableHead className="text-center text-xs font-bold uppercase">STATUS</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase">TX HASH</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow 
                  key={trade.id} 
                  className="border-b border-zinc-900/50 hover:bg-zinc-900/60 transition-colors cursor-pointer group/row"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <TableCell className="font-mono text-xs text-zinc-500">{trade.time}</TableCell>
                  <TableCell className="font-bold text-white italic">{trade.pair}</TableCell>
                  <TableCell className={`text-right font-mono font-bold ${trade.status === 'SUCCESS' ? 'text-green-400' : 'text-zinc-500'}`}>
                    {trade.profit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-zinc-500">{trade.gas}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={trade.status === 'SUCCESS' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0'
                      }
                    >
                      {trade.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center text-zinc-600 group-hover/row:text-zinc-400 transition-colors text-xs font-mono">
                      {`${trade.hash.substring(0, 6)}...${trade.hash.substring(trade.hash.length - 4)}`}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-900 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-bold text-white tracking-tight uppercase italic">
                  Trade Forensics
                </CardTitle>
              </div>
              <button 
                onClick={() => setSelectedTrade(null)}
                className="p-1 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Asset Pair</p>
                  <p className="text-lg font-black text-white italic">{selectedTrade.pair}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Execution Status</p>
                  <Badge 
                    variant="outline"
                    className={selectedTrade.status === 'SUCCESS' 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }
                  >
                    {selectedTrade.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Code className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Transaction Input Data (Raw)</p>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs text-green-500/80 break-all leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedTrade.inputData}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                <div className="text-xs text-zinc-500 font-mono">
                  TX: {selectedTrade.hash}
                </div>
                <button className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveEvents;
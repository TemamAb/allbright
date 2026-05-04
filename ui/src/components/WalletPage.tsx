import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Wallet, ArrowLeftRight, ShieldCheck, RefreshCcw, ChevronsUpDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useWallets, useWalletBalance } from '@/lib/api';

type SortConfig = { key: 'address' | 'balance'; direction: 'asc' | 'desc' } | null;

export default function WalletPage() {
  const { wallets, addWallet, deleteWallet, totalBalance } = useWallets();
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [liveBalance, setLiveBalance] = useState(totalBalance);
  
  const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Real-time balance updates via socket
  useEffect(() => {
    const socket = io(baseApiUrl);
    socket.on('summary_update', (data: { walletBalance?: number }) => {
      if (data.walletBalance !== undefined) {
        setLiveBalance(data.walletBalance);
      }
    });
    return () => { socket.disconnect(); };
  }, [baseApiUrl]);

  // Sortable wallets
  const sortedWallets = useMemo(() => {
    let items = [...wallets];
    if (sortConfig) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key === 'balance' ? 'balance' : 'address'];
        const bVal = b[sortConfig.key === 'balance' ? 'balance' : 'address'];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [wallets, sortConfig]);

  const requestSort = (key: 'address' | 'balance') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleWithdraw = () => {
    if (parseFloat(withdrawAmount) <= 0) {
      toast.error('Withdrawal failed', { description: 'Amount must be greater than 0.' });
      return;
    }
    // Mocking an API call for withdrawal
    // In a real scenario, this would interact with your backend
    console.log(`Attempting to withdraw ${withdrawAmount} ETH`);
    // Simulate success
    toast.success('Withdrawal executed to smart wallet');
    setWithdrawAmount('');
  };

  const handleAutoToggle = () => {
    toast.success(`Auto withdrawal ${autoWithdraw ? 'disabled' : 'enabled'}`);
    setAutoWithdraw(!autoWithdraw);
  };

  // Mock Transfer History data - replace with actual API call
  const transferHistory = [
    { id: 'tx1', timestamp: new Date(), type: 'Withdrawal', amount: 0.1234, unit: 'ETH', to: '0xabc...123', status: 'Completed', txHash: '0x1a2b3c4d...' },
    { id: 'tx2', timestamp: new Date(Date.now() - 3600000), type: 'Deposit', amount: 0.5, unit: 'ETH', from: '0xdef...456', status: 'Completed', txHash: '0x5e6f7g8h...' },
    { id: 'tx3', timestamp: new Date(Date.now() - 7200000), type: 'Withdrawal', amount: 0.05, unit: 'ETH', to: '0xghi...789', status: 'Pending', txHash: '0x9i0j1k2l...' },
  ];

  const walletsList = wallets.map((wallet) => (
    <div key={wallet.id} className="flex items-center justify-between p-6 bg-black rounded-xl border border-zinc-800">
      <div>
        <div className="font-mono text-lg">{wallet.address.slice(0,6)}...{wallet.address.slice(-4)}</div>
        <div className="text-sm text-gray-400">{wallet.chain}</div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{wallet.balance} ETH</div>
        <Button variant="outline" size="sm" onClick={() => deleteWallet(wallet.id)} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-red-500 hover:border-red-500/50">
          Revoke Session Key
        </Button>
      </div>
    </div>
  ));

return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Wallet Management</h2>
          <p className="text-zinc-500 font-medium mt-1">Orchestrating liquidity and execution signers.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Total Liquidity</p>
            <p className="text-xl font-black text-emerald-500 font-mono">{liveBalance.toFixed(4)} ETH</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sortable Table - Authorized Signers */}
        <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#111217] flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
              <Wallet className="mr-2 h-4 w-4 text-cyan-500" /> Authorized Signers
            </span>
            <button onClick={addWallet} className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 uppercase">
              + Add Signer
            </button>
          </div>
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-mono text-xs cursor-pointer" onClick={() => requestSort('address')}>
                  ADDRESS <ChevronsUpDown size={10} className="inline ml-1"/>
                </TableHead>
                <TableHead className="text-zinc-500 font-mono text-xs text-right cursor-pointer" onClick={() => requestSort('balance')}>
                  BALANCE <ChevronsUpDown size={10} className="inline ml-1"/>
                </TableHead>
                <TableHead className="text-zinc-500 font-mono text-xs text-center">SOURCE</TableHead>
                <TableHead className="text-zinc-500 font-mono text-xs text-right">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWallets.map((w) => (
                <TableRow key={w.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/20">
                  <TableCell className="font-mono text-xs text-white">{w.address.slice(0,8)}...{w.address.slice(-4)}</TableCell>
                  <TableCell className="text-right font-mono text-zinc-300">{w.balance} ETH</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">ONBOARDING</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ACTIVE</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Auto-Withdraw */}
          <div className="bg-black border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Auto-Sweep</span>
              <Switch 
                checked={autoWithdraw}
                onCheckedChange={handleAutoToggle}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              Profits exceeding 1.0 ETH automatically swept to cold treasury.
            </p>
          </div>

          {/* Emergency Protocol */}
          <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-400 uppercase">Emergency Protocol</span>
            </div>
            <p className="text-[10px] text-blue-400/70">Initiate global liquidity drain to main controller.</p>
          </div>

          {/* Manual Withdrawal */}
          <div className="bg-black border border-zinc-800 rounded-xl p-6">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Capital Extraction</span>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0000 ETH"
              className="mb-3 text-xl font-mono bg-zinc-950 border-zinc-800"
            />
            <Button onClick={handleWithdraw} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase text-xs">
              Authorize Withdrawal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

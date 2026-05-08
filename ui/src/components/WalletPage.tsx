import { useState } from 'react';
import { Wallet, ShieldCheck, ChevronsUpDown, Trash2, ArrowUpRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useEngine } from '@/stores/engine';

export default function WalletPage() {
  const { engine } = useEngine();
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Mock wallets based on reference
  const [wallets, setWallets] = useState([
    { id: 'w1', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', balance: 2.45, status: 'ACTIVE' },
    { id: 'w2', address: '0xEf890123456789ABCDEF0123456789ABCDEF0123', balance: 4.10, status: 'ACTIVE' }
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleWithdraw = () => {
    if (parseFloat(withdrawAmount) <= 0) {
      toast.error('Withdrawal failed', { description: 'Amount must be greater than 0.' });
      return;
    }
    toast.success(`Withdrawal of ${withdrawAmount} ETH initiated`, {
      description: 'Authorizing via session key...',
    });
    setWithdrawAmount('');
  };

  const addMockWallet = () => {
    const newWallet = {
      id: Date.now().toString(),
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      balance: 0.5,
      status: 'ACTIVE'
    };
    setWallets([...wallets, newWallet]);
    toast.success('New signer added to vault');
  };

  const removeWallet = (id: string) => {
    setWallets(wallets.filter(w => w.id !== id));
    toast.info('Signer session revoked');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Vault Management</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Institutional Liquidity Controller</p>
        </div>
        <div className="bg-ash-black border border-ash-border px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Liquidity</p>
            <p className="text-2xl font-black text-emerald-accent font-mono tabular-nums">{totalBalance.toFixed(4)} ETH</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 flex items-center justify-center border border-emerald-accent/20">
            <Wallet className="text-emerald-accent" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signers Table */}
        <div className="lg:col-span-2 bg-ash-black border border-ash-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-ash-border bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-cyan-accent" size={18} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Authorized Signers</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addMockWallet}
              className="text-[10px] font-black text-cyan-accent hover:text-white hover:bg-cyan-accent/10 uppercase tracking-widest"
            >
              + Add Signer
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-b border-ash-border/50 hover:bg-transparent">
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest">Address</TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">Balance</TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w) => (
                  <TableRow key={w.id} className="border-b border-ash-border/20 group hover:bg-white/[0.01]">
                    <TableCell className="px-6 py-4 font-mono text-xs text-white">
                      <div className="flex items-center gap-2">
                        {w.address.slice(0, 10)}...{w.address.slice(-6)}
                        <ArrowUpRight size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-emerald-accent font-bold">
                      {w.balance.toFixed(2)} ETH
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeWallet(w.id)}
                        className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Auto-Sweep */}
          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-emerald-accent" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Sweep</span>
              </div>
              <Switch 
                checked={autoWithdraw}
                onCheckedChange={(val) => {
                  setAutoWithdraw(val);
                  toast.success(`Auto-Sweep ${val ? 'Enabled' : 'Disabled'}`);
                }}
                className="data-[state=checked]:bg-emerald-accent"
              />
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-tight">
              Profits exceeding 1.0 ETH automatically swept to secure cold treasury.
            </p>
          </div>

          {/* Manual Withdrawal */}
          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-accent/5 blur-3xl -mr-16 -mt-16" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-6">Capital Extraction</span>
            <div className="space-y-4 relative z-10">
              <div className="relative">
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0000 ETH"
                  className="h-14 text-xl font-mono bg-black/40 border-ash-border focus:border-cyan-accent/50 rounded-xl pl-4 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">ETH</span>
              </div>
              <Button 
                onClick={handleWithdraw} 
                className="w-full h-12 bg-cyan-accent hover:bg-cyan-accent/80 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg shadow-cyan-accent/10"
              >
                Authorize Withdrawal
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white/[0.02] border border-ash-border/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-zinc-500">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">BSS-56 Elite lock active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

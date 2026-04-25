import { useState, useEffect } from 'react';
import { useWallets } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Edit2, Save, Plus, Wallet as WalletIcon } from 'lucide-react';

export default function WalletPage() {
  const { wallets, addWallet, updateWallet, deleteWallet, fetchBalance, totalBalance } = useWallets();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Validation: simple Ethereum address check
  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Auto-balance fetch when address + chain become non-empty
  useEffect(() => {
    wallets.forEach(w => {
      if (w.address && w.chain && editingId !== w.id) {
        fetchBalance(w.address, w.chain as any);
      }
    });
  }, [wallets.map(w => w.address + w.chain).join(','), fetchBalance, editingId]);

  const handleSave = async (id: number) => {
    setEditingId(null);
    toast.success('Wallet updated');
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this wallet?')) {
      deleteWallet(id);
      toast.success('Wallet deleted');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const to = withdrawTo.trim();
    if (!amount || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }
    if (!validateAddress(to)) {
      toast.error('Invalid destination address');
      return;
    }
    if (amount > totalBalance) {
      toast.error('Insufficient balance');
      return;
    }

    // Mock withdrawal API call
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vault/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, to }),
      });

      if (resp.ok) {
        const tx = await resp.json();
        setWithdrawals(prev => [{
          id: Date.now().toString(),
          type: 'WITHDRAWAL',
          amount: `${amount} ETH`,
          txHash: tx.txHash || '0x' + Math.random().toString(16).slice(2, 10) + '...',
          timestamp: new Date().toISOString(),
          status: 'PENDING',
        }, ...prev]);
        setWithdrawAmount('');
        setWithdrawTo('');
        toast.success('Withdrawal queued');
      } else {
        toast.error('Withdrawal failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const activeWallets = wallets.filter(w => w.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-bright-blue" />
          <h1 className="text-electric text-2xl font-bold uppercase tracking-widest">
            Wallet Vault
          </h1>
        </div>
        <Button onClick={addWallet} size="sm" className="gap-2">
          <Plus size={16} /> Add Wallet
        </Button>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Total Balance
          </div>
          <div className="text-2xl font-bold neon-glow-green mt-1">
            {totalBalance.toFixed(4)} ETH
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ~${(totalBalance * 2350).toLocaleString()}
          </div>
        </div>
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Active Wallets
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {activeWallets.length}
          </div>
        </div>
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Chain Coverage
          </div>
          <div className="text-2xl font-bold bright-blue-text mt-1">
            {new Set(wallets.map(w => w.chain)).size} Chains
          </div>
        </div>
      </div>

      {/* Wallet Table */}
      <div className="glass-panel border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-black/20">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                #
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                Address
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                Chain
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                Active
              </th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {wallets.map((wallet, index) => (
              <tr key={wallet.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-muted-foreground font-mono">
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-mono bright-blue-text text-xs">
                  {editingId === wallet.id ? (
                    <Input
                      value={wallet.address}
                      onChange={e => updateWallet(wallet.id, { address: e.target.value })}
                      placeholder="0x..."
                      className="h-7 text-xs bg-black/20 border-border"
                    />
                  ) : (
                    wallet.address || '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === wallet.id ? (
                    <Select
                      value={wallet.chain}
                      onValueChange={(v: any) => updateWallet(wallet.id, { chain: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs bg-black/20 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ethereum</SelectItem>
                        <SelectItem value="8453">Base</SelectItem>
                        <SelectItem value="42161">Arbitrum</SelectItem>
                        <SelectItem value="10">Optimism</SelectItem>
                        <SelectItem value="137">Polygon</SelectItem>
                        <SelectItem value="43114">Avalanche</SelectItem>
                        <SelectItem value="56">BSC</SelectItem>
                        <SelectItem value="250">Fantom</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {wallet.chain}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-neon-green font-bold">
                  {parseFloat(wallet.balance || '0').toFixed(4)} ETH
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${wallet.isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={`text-[10px] uppercase font-bold ${wallet.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {wallet.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={wallet.active}
                    onCheckedChange={(checked) => updateWallet(wallet.id, { active: checked })}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === wallet.id ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(wallet.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Save size={14} />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(wallet.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(wallet.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal */}
      <Card className="glass-panel border border-border">
        <CardHeader>
          <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Profit Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground mb-1 block">
                Amount (ETH)
              </label>
              <Input
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="bg-black/20 border-border"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground mb-1 block">
                Destination Address
              </label>
              <Input
                value={withdrawTo}
                onChange={e => setWithdrawTo(e.target.value)}
                placeholder="0x..."
                className="bg-black/20 border-border"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !withdrawTo}
              className="gap-2"
            >
               <WalletIcon size={14} className="text-foreground" />
              Withdraw
            </Button>
          </div>

          {withdrawals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Recent Withdrawals
              </div>
              <div className="space-y-2">
                {withdrawals.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <div>
                      <span className="text-foreground font-mono">{tx.amount}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-[9px]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-mono">{tx.txHash}</span>
                      <Badge variant={tx.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Wallet({ size, className }: { size: number; className: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 7V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 11v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
      <path d="M12 11v6" />
      <path d="M8 11v6" />
      <path d="M16 11v6" />
    </svg>
  );
}

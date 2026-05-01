import { useState } from 'react';
import { Wallet, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useWallets, useWalletBalance } from '@/lib/api';
import { Be } from "@/lib/utils";

export default function WalletPage() {
  const { wallets, addWallet, updateWallet, deleteWallet, totalBalance } = useWallets();
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

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
    <div className="space-y-6 h-full animate-in fade-in duration-500">
      {/* Total Profit */}
      <div className="bg-black border border-zinc-800 rounded-xl p-10 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32" />
        <h2 className="text-[10px] font-bold text-zinc-500 mb-6 uppercase tracking-[0.4em]">Total Accumulated Yield</h2>
        <div className="text-7xl font-black text-emerald-500 mb-4 tabular-nums tracking-tighter">
          {totalBalance.toFixed(4)} ETH
        </div>
        {/* <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">$29,241.82 USD Equiv.</div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Integrity Ledger (Wallets List) */}
        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#111217]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Integrity Ledger</span>
          </div>
          <div className="p-6 space-y-4">
            {walletsList.length ? walletsList : <p className="text-zinc-600 text-center py-8 text-xs italic">No connected vaults detected</p>}
            <button onClick={addWallet} className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase rounded-lg hover:bg-zinc-800 transition-all">
              Provision New Session Key
            </button>
          </div>
        </div>

        {/* Withdrawal Panel */}
        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-[#111217]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Capital Extraction Gate</span>
          </div>
          <div className="p-6 space-y-6">
          {/* Auto Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#111217] rounded-lg border border-zinc-800/50">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-tight">Auto-Sweep</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Daily 00:00 UTC</p>
            </div>
            <Switch 
              checked={autoWithdraw}
              onCheckedChange={handleAutoToggle}
              className="data-[state=checked]:bg-emerald-600"
              aria-label="Auto withdrawal toggle"
            />
          </div>

          {/* Manual */}
          <div className="space-y-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Extraction Amount (ETH)</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.0000"
                className="h-12 text-xl font-mono bg-black border border-zinc-800 focus:border-cyan-500/50 text-white"
              />
            </div>
            <button onClick={handleWithdraw} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase rounded-lg transition-all shadow-lg shadow-cyan-500/10">
              Authorize Withdrawal
            </button>
          </div>

          <div className="text-center text-[9px] text-zinc-600 font-mono uppercase leading-relaxed">
            Profits compound autonomously unless swept. <br/>Verified ERC-4337 bundling. No local PK exposure.
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

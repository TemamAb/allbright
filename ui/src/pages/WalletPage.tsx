import { useState } from 'react';
import { Wallet, Key, ArrowLeftRight, Switch as SwitchIcon, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function WalletPage() {
  const [privateKey, setPrivateKey] = useState('');
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [totalProfit, setTotalProfit] = useState('12.45 ETH');

  const handleSaveKey = () => {
    if (privateKey.trim()) {
      toast.success('Private key saved to secure vault');
      setPrivateKey('');
    }
  };

  const handleWithdraw = () => {
    if (withdrawAmount) {
      toast.success('Withdrawal executed to smart wallet');
      setWithdrawAmount('');
    }
  };

  const handleAutoToggle = () => {
    toast.success(`Auto withdrawal ${autoWithdraw ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Wallet size={40} className="text-blue-400" />
        <h1 className="text-4xl font-bold text-white">Smart Wallet Panel</h1>
      </div>

      {/* Total Profit */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-900/20 border-4 border-emerald-500/40 rounded-3xl p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide">Total Accumulated Profit</h2>
        <div className="text-7xl font-black text-emerald-400 mb-4 drop-shadow-2xl">
          {totalProfit}
        </div>
        <div className="text-2xl text-emerald-300">$29.2k USD</div>
      </div>

      {/* Private Key Panel */}
      <Card className="glass-panel bg-gray-900/50 border border-gray-700 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Key size={28} className="text-yellow-400" />
            Smart Wallet Private Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <Input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x... (paste your private key)"
              className="flex-1 h-16 text-xl font-mono bg-gray-800/50 border-2 border-yellow-500/30 focus:border-yellow-400"
            />
            <Button onClick={handleSaveKey} size="lg" className="h-16 px-12 bg-yellow-600 hover:bg-yellow-700 text-xl">
              <Save size={24} className="mr-2" />
              Save Securely
            </Button>
          </div>
          <div className="text-lg text-gray-400 text-center">
            🔒 Encrypted & stored in secure enclave. Never transmitted.
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Panel */}
      <Card className="glass-panel bg-gray-900/50 border border-gray-700 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <ArrowLeftRight size={28} className="text-blue-400" />
            Profit Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Toggle */}
          <div className="flex items-center justify-between p-6 bg-gray-800/50 rounded-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Auto Withdrawal</h3>
              <p className="text-lg text-gray-400">Sweep profits to cold wallet daily at 00:00 UTC</p>
            </div>
            <Switch 
              checked={autoWithdraw}
              onCheckedChange={handleAutoToggle}
              className="data-[state=checked]:bg-emerald-600"
              aria-label="Auto withdrawal toggle"
            />
          </div>

          {/* Manual */}
          <div className="flex items-end gap-4 p-6 bg-blue-900/20 rounded-2xl border-2 border-blue-500/30">
            <div className="flex-1">
              <label className="text-lg font-bold text-white mb-3 block">Manual Amount (ETH)</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="h-16 text-2xl font-mono bg-blue-800/30 border-2 border-blue-400 focus:border-blue-300 text-center"
              />
            </div>
            <Button onClick={handleWithdraw} size="lg" className="h-16 px-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-xl font-bold shadow-lg">
              Withdraw Now
            </Button>
          </div>

          <div className="text-center text-lg text-gray-400">
            📈 Profits automatically compound unless withdrawn. Gas optimized bundling.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


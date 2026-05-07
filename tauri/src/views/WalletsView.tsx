import React, { useState } from "react";
import { Wallet, Trash2, ArrowDownCircle } from "lucide-react";
import { useWallets } from "../lib/api";

export default function WalletsView() {
  const { wallets, addWallet, deleteWallet, totalBalance, loading } = useWallets();
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = () => {
    if(parseFloat(withdrawAmount) > 0) alert(`Withdrawal of ${withdrawAmount} ETH (simulated)`);
  };

  const addMockWallet = () => {
    // In a real app, this would trigger a wallet connection
    alert("Wallet connection integration required.");
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase text-white">Vault Management</h2>
        <div className="card-ash px-4 py-2 rounded-lg">
          <span className="text-[10px] uppercase text-secondary font-bold tracking-widest">Total Liquidity</span>
          <div className="bg-data-black inline-block px-3 py-1 rounded text-xl font-black text-emerald-500 ml-2 font-mono">
            {totalBalance.toFixed(4)} ETH
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-ash overflow-hidden">
          <div className="px-6 py-4 border-b border-ash flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              <Wallet className="inline mr-2 text-cyan-500" size={16} />
              Authorized Signers
            </span>
            <button 
              onClick={addMockWallet}
              className="text-cyan-500 text-xs uppercase font-bold hover:text-cyan-400"
            >
              + Add Signer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3">ADDRESS</th>
                  <th className="px-4 py-3 text-right">BALANCE</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="border-b border-ash">
                    <td className="px-4 py-3 font-mono text-white">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 bg-data-black text-right font-mono text-emerald-400 font-bold">
                      {wallet.balanceEth?.toFixed(4) || '0.0000'} ETH
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-[#32323e] text-secondary px-2 py-0.5 rounded text-[9px] font-bold">ACTIVE</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => deleteWallet(wallet.id)}
                        className="text-red-500/70 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-ash p-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-secondary tracking-widest">Auto-Sweep</span>
              <button 
                onClick={() => setAutoWithdraw(!autoWithdraw)} 
                className={`w-10 h-5 rounded-full relative transition-all ${autoWithdraw ? 'bg-emerald-600' : 'bg-[#3a3a48]'}`}
              >
                <span className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all ${autoWithdraw ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <p className="text-[10px] text-secondary mt-3 italic">
              Profits exceeding 1.0 ETH auto-swept to main controller.
            </p>
          </div>

          <div className="card-ash p-5">
            <span className="text-xs font-bold uppercase block mb-3 text-secondary tracking-widest">Capital Extraction</span>
            <input 
              type="number" 
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0000 ETH" 
              className="w-full bg-data-black border border-ash rounded p-3 text-sm mb-3 text-white font-mono"
            />
            <button 
              onClick={handleWithdraw}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-all"
            >
              Authorize Withdrawal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
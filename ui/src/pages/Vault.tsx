import React, { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle, XCircle, History, Save, ArrowUpRight } from "lucide-react";

export default function Vault() {
  const [withdrawalMode, setWithdrawalMode] = useState<"AUTO" | "MANUAL">("MANUAL");
  const [wallets] = useState([
    { id: 1, address: "0x748Aa8ee067585F5bd02f0988eF6E71f2d662751", chains: ["Base", "Ethereum"], balance: "0.00 ETH", isValid: true, isActive: true }
  ]);
  const [transfers] = useState([
    { id: "tx_1", type: "WITHDRAWAL", amount: "0.05 ETH", txHash: "0x3a2f...e4d1", timestamp: new Date().toISOString(), status: "CONFIRMED" }
  ]);

  const totalBalance = 0.00;

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-100">Vault Operations</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded hover:bg-primary/90 transition-colors uppercase text-xs font-bold tracking-widest">
          <Plus size={16} /> Add Wallet
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Vault Ledger */}
        <div className="lg:col-span-2 bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="border-b border-zinc-800 p-4">
            <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">Vault Integrity Ledger</span>
          </div>
          <div className="flex-1 bg-black p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">ID</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Address</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Chains</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Balance</th>
                  <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {wallets.map((w, i) => (
                  <tr key={w.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                    <td className="px-4 py-4 text-xs font-mono">{i + 1}</td>
                    <td className="px-4 py-4 text-xs font-mono text-primary">{w.address}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {w.chains.map(c => <span key={c} className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded uppercase">{c}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-green-400">{w.balance}</td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] uppercase font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-800 p-4 bg-[#1a1a1c] flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Liquidity</span>
            <span className="text-lg font-bold text-green-400 font-mono">{totalBalance.toFixed(2)} ETH</span>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="border-b border-zinc-800 p-4">
              <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">Withdrawal Control</span>
            </div>
            <div className="bg-black p-6 space-y-6">
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                  onClick={() => setWithdrawalMode("AUTO")}
                  className={`flex-1 px-3 py-2 text-xs uppercase font-bold rounded transition-all ${withdrawalMode === "AUTO" ? "bg-primary text-black" : "text-zinc-500"}`}
                >Auto</button>
                <button 
                  onClick={() => setWithdrawalMode("MANUAL")}
                  className={`flex-1 px-3 py-2 text-xs uppercase font-bold rounded transition-all ${withdrawalMode === "MANUAL" ? "bg-primary text-black" : "text-zinc-500"}`}
                >Manual</button>
              </div>
              <div className="border border-zinc-800 rounded-lg p-4 bg-[#1a1a1c]">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Available to Withdraw</div>
                <div className="text-2xl font-black text-primary font-mono">0.00 ETH</div>
              </div>
              <button className="w-full py-3 bg-primary text-black rounded-lg text-xs uppercase font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                Execute Withdrawal
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="border-b border-zinc-800 p-4 flex items-center gap-2">
              <History size={14} className="text-zinc-400" />
              <span className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-wider">Transfer Ledger</span>
            </div>
            <div className="bg-black p-4 space-y-2">
              {transfers.map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 border border-zinc-800 rounded-lg bg-[#1a1a1c]">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight size={14} className="text-red-400" />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-300">{tx.type}</div>
                      <div className="text-[9px] text-zinc-500 font-mono">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-red-400">{tx.amount}</div>
                    <div className="text-[9px] text-primary font-mono">{tx.txHash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { TrendingUp, Clock, Wallet as WalletIcon } from "lucide-react";

export default function Dashboard() {
  const [showUSD, setShowUSD] = useState(false);

  return (
    <div className="space-y-12 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white uppercase tracking-wide">
          Profit Metrics Grid
        </h1>
        <button 
          onClick={() => setShowUSD(!showUSD)} 
          className="px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all text-lg font-bold"
        >
          {showUSD ? "USD" : "ETH"}
        </button>
      </div>

      {/* Profit Grid - 3 col layout no cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profit/Hour */}
        <div className="bg-gradient-to-b from-emerald-900/50 to-emerald-900/20 border-4 border-emerald-500/40 rounded-3xl p-12 text-center shadow-2xl hover:scale-[1.02] transition-all group">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-2xl border-4 border-emerald-500/50 mx-auto mb-8 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <TrendingUp size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Profit / Hour</h2>
          <div className="text-6xl font-black text-emerald-400 mb-4 drop-shadow-2xl">
            +0.124 ETH
          </div>
          <div className="text-xl text-emerald-300">$291 / hr</div>
        </div>

        {/* Profit / Trade */}
        <div className="bg-gradient-to-b from-blue-900/50 to-blue-900/20 border-4 border-blue-500/40 rounded-3xl p-12 text-center shadow-2xl hover:scale-[1.02] transition-all group">
          <div className="w-24 h-24 bg-blue-500/20 rounded-2xl border-4 border-blue-500/50 mx-auto mb-8 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <TrendingUp size={48} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Profit / Trade</h2>
          <div className="text-6xl font-black text-blue-400 mb-4 drop-shadow-2xl">
            0.0031 ETH
          </div>
          <div className="text-xl text-blue-300">$7.30 avg</div>
        </div>

        {/* Total Profit Smart Wallet */}
        <div className="bg-gradient-to-b from-purple-900/50 to-purple-900/20 border-4 border-purple-500/40 rounded-3xl p-12 text-center shadow-2xl hover:scale-[1.02] transition-all group">
          <div className="w-24 h-24 bg-purple-500/20 rounded-2xl border-4 border-purple-500/50 mx-auto mb-8 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <WalletIcon size={48} className="text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Total Profit Wallet</h2>
          <div className="text-6xl font-black text-purple-400 mb-4 drop-shadow-2xl">
            12.45 ETH
          </div>
          <div className="text-xl text-purple-300">$29.2k USD</div>
        </div>
      </div>

      {/* CTA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <button className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 p-12 rounded-3xl text-2xl font-bold text-white shadow-2xl hover:shadow-emerald-500/25 transition-all">
          Optimize Now
        </button>
        <button className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 p-12 rounded-3xl text-2xl font-bold text-white shadow-2xl hover:shadow-blue-500/25 transition-all">
          New Scan
        </button>
        <button className="group bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 p-12 rounded-3xl text-2xl font-bold text-white shadow-2xl hover:shadow-purple-500/25 transition-all">
          Withdraw Profits
        </button>
      </div>
    </div>
  );
}


import React, { useState } from "react";

export default function EventsView() {
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('ALL');

  const liveTrades = [
    { id: '1', time: '14:20:01', pair: 'WETH/USDC', profit: '+0.42 ETH', status: 'SUCCESS', hash: '0xabc123...' },
    { id: '2', time: '14:18:45', pair: 'WBTC/WETH', profit: '+1.12 ETH', status: 'SUCCESS', hash: '0xdef456...' },
    { id: '3', time: '14:15:10', pair: 'LINK/WETH', profit: '0.00 ETH', status: 'REVERTED', hash: '0x789abc...' }
  ];

  const filteredEvents = liveTrades.filter(trade => {
    const matchesSearch = trade.pair.toLowerCase().includes(eventSearch.toLowerCase()) || trade.hash.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesStatus = eventStatusFilter === 'ALL' || trade.status === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase text-white">Live Blockchain Events</h2>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            placeholder="Search pair/hash" 
            className="bg-data-black border border-ash rounded px-3 py-1 text-xs text-white"
          />
          <select 
            value={eventStatusFilter}
            onChange={(e) => setEventStatusFilter(e.target.value)}
            className="bg-data-black border border-ash rounded text-xs px-2 text-white"
          >
            <option>ALL</option>
            <option>SUCCESS</option>
            <option>REVERTED</option>
          </select>
        </div>
      </div>
      <div className="card-ash overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th className="px-4 py-3">TIME</th>
              <th className="px-4 py-3">PAIR</th>
              <th className="px-4 py-3 text-right">PROFIT</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3">TX HASH</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((trade) => (
              <tr key={trade.id} className="border-b border-ash">
                <td className="px-4 py-3 font-mono text-secondary">{trade.time}</td>
                <td className="px-4 py-3 font-bold text-white">{trade.pair}</td>
                <td className="px-4 py-3 bg-data-black text-right text-emerald-400 font-mono">{trade.profit}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${trade.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-400'}`}>
                    {trade.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-secondary">{trade.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

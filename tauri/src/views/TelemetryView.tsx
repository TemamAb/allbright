import React from "react";

export default function TelemetryView() {
  const telemetryCategories = [
    { name: 'Profitability', value: '96.2%', target: '>90%', status: 'GOOD', statusClass: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Latency (ms)', value: '187ms', target: '<200ms', status: 'GOOD', statusClass: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'MEV Guard', value: 'Active', target: 'Active', status: 'NOMINAL', statusClass: 'bg-emerald-500/20 text-emerald-500' },
    { name: 'Bribe Efficiency', value: '96.5%', target: '>95%', status: 'EXCELLENT', statusClass: 'bg-emerald-500/20 text-emerald-500' }
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <div className="card-ash p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Global Efficiency Score</h1>
          <p className="text-xs text-secondary">Last Update: realtime</p>
        </div>
        <div className="bg-data-black px-6 py-3 rounded-xl text-4xl font-black text-emerald-400 font-mono">
          85.2%
        </div>
      </div>

      <div className="card-ash overflow-hidden">
        <div className="px-6 py-3 border-b border-ash font-bold text-sm uppercase tracking-wider text-secondary">
          36 KPI Telemetry Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Observed</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {telemetryCategories.map((cat) => (
                <tr key={cat.name} className="border-b border-ash">
                  <td className="px-4 py-3 font-bold text-white">{cat.name}</td>
                  <td className="px-4 py-3 bg-data-black font-mono text-emerald-400">{cat.value}</td>
                  <td className="px-4 py-3 bg-data-black text-secondary">{cat.target}</td>
                  <td className="px-4 py-3">
                    <span className={`${cat.statusClass} px-2 py-0.5 rounded text-[9px] font-black uppercase`}>
                      {cat.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

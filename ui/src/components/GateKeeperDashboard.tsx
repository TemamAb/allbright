import React from 'react';
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export const GateKeeperDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white text-center">
        <Shield size={64} className="mx-auto mb-6 opacity-90" />
        <h1 className="text-4xl font-bold mb-4">Gate Keeper System</h1>
        <p className="text-xl text-indigo-100">Multi-layer Deployment Protection</p>
        <div className="mt-8">
          <div className="inline-flex items-center px-8 py-4 bg-green-500/20 border-2 border-green-500 rounded-full text-lg font-bold">
            <CheckCircle size={24} className="mr-3 text-green-400" />
            READY FOR DEPLOYMENT
          </div>
        </div>
      </div>

      {/* Clean Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-gray-900/50 border-2 border-green-500/30 rounded-2xl p-10 text-center hover:shadow-xl">
          <CheckCircle size={56} className="mx-auto mb-6 text-green-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Code Quality</h3>
          <div className="text-4xl font-black text-green-400 mb-4">PASS</div>
          <p className="text-lg text-gray-300">All builds clean</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-blue-500/30 rounded-2xl p-10 text-center hover:shadow-xl">
          <CheckCircle size={56} className="mx-auto mb-6 text-blue-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Infrastructure</h3>
          <div className="text-4xl font-black text-blue-400 mb-4">READY</div>
          <p className="text-lg text-gray-300">Services healthy</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-emerald-500/30 rounded-2xl p-10 text-center hover:shadow-xl">
          <CheckCircle size={56} className="mx-auto mb-6 text-emerald-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Security</h3>
          <div className="text-4xl font-black text-emerald-400 mb-4">SECURE</div>
          <p className="text-lg text-gray-300">All checks passed</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-yellow-500/30 rounded-2xl p-10 text-center hover:shadow-xl">
          <CheckCircle size={56} className="mx-auto mb-6 text-yellow-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Performance</h3>
          <div className="text-4xl font-black text-yellow-400 mb-4">OPTIMAL</div>
          <p className="text-lg text-gray-300">KPIs beating benchmarks</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-purple-500/30 rounded-2xl p-10 text-center hover:shadow-xl">
          <CheckCircle size={56} className="mx-auto mb-6 text-purple-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Business</h3>
          <div className="text-4xl font-black text-purple-400 mb-4">AUTHORIZED</div>
          <p className="text-lg text-gray-300">Final approval granted</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-gray-500/30 rounded-2xl p-10 text-center hover:shadow-xl col-span-1 md:col-span-2 lg:col-span-1">
          <AlertCircle size={56} className="mx-auto mb-6 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-4">Emergency Override</h3>
          <div className="text-2xl font-bold text-gray-400 mb-4">DISABLED</div>
          <p className="text-lg text-gray-300">CEO/CTO authorization required</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-12">
        <button className="px-16 py-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-2xl font-bold rounded-2xl hover:shadow-2xl shadow-xl transition-all">
          Proceed to Production
        </button>
      </div>
    </div>
  );
};


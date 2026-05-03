import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';

export const WelcomeMissionBubble: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = io();
    socket.on('copilot_event', (event: any) => {
      if (event.type === 'WELCOME_MISSION' || event.data?.kpiCategory === 'WELCOME_MISSION') {
        setMessage(`Systems Nominal. Intelligence graduated to Private Node. I am standing by for mission orders, Operator.`);
        setVisible(true);
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
        >
          <div className="bg-[#2d2d2d] border border-[#5794f2]/30 p-4 rounded-2xl shadow-2xl shadow-black/50 relative">
            <button 
              onClick={() => setVisible(false)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#404040] flex items-center justify-center text-[#8e8e8e] hover:text-white"
            >
              <X size={12} />
            </button>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#5794f2]/20 flex items-center justify-center shrink-0">
                <Zap className="text-[#5794f2]" size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#5794f2] uppercase tracking-widest">Alpha-Copilot</span>
                  <div className="w-1 h-1 rounded-full bg-[#73bf69] animate-pulse" />
                </div>
                <p className="text-xs text-[#d8d9da] leading-relaxed font-medium italic">
                  "{message}"
                </p>
              </div>
            </div>
          </div>
          <div className="w-4 h-4 bg-[#2d2d2d] border-r border-b border-[#5794f2]/30 absolute -bottom-2 right-8 rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

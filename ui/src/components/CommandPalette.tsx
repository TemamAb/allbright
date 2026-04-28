import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const COMMANDS = [
  { id: 'tune-kpis', label: 'Full KPI Tune Cycle', desc: 'Orchestrate all 7 specialists' },
  { id: 'analyze-perf', label: 'Performance Analysis', desc: 'Generate system report' },
  { id: 'dispatch-order', label: 'Dispatch Debug Order', desc: 'Send signed command to Rust' },
  { id: 'redeploy', label: 'System Redeploy', desc: 'Restart worker via copilot' },
];

interface CommandPaletteProps {
  onSelect: (commandId: string) => void;
  open: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelect, open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (command: typeof COMMANDS[0]) => {
    onSelect(command.id);
    onClose();
    toast.success(`Executing: ${command.label}`);
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose}>
      <div className="max-w-md mx-auto mt-20" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <kbd className="bg-slate-800 px-2 py-1 rounded text-xs font-mono">⌘K</kbd>
            <h3 className="font-bold text-slate-200">Command Palette</h3>
          </div>
          
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands..."
            className="w-full bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl text-slate-200 placeholder-slate-500 focus:border-primary/50 focus:outline-none mb-4"
          />

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  index === selectedIndex
                    ? 'bg-primary/20 border-primary/50 border'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="font-semibold">{cmd.label}</div>
                <div className="text-sm text-slate-500">{cmd.desc}</div>
              </button>
            ))}
          </div>

          {filteredCommands.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No commands match "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;


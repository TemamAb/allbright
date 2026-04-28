import React, { useState, useEffect } from 'react';
import { useSocket } from '../App';

interface Event {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

const EventTimeline: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('copilot-event', (data: Event) => {
        setEvents(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
      });
    }

    return () => {
      socket?.off('copilot-event');
    };
  }, [socket]);

  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50 p-4 h-48 overflow-y-auto">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        Live Mission Log
      </h3>
      {events.map((event) => (
        <div key={event.id} className={`mb-2 p-2 rounded-lg border-l-4 ${getTypeColor(event.type)}`}>
          <div className="text-sm font-mono text-slate-300">{event.message}</div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(event.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-slate-500 text-sm italic text-center py-8">
          Awaiting mission events...
        </div>
      )}
    </div>
  );
};

export default EventTimeline;


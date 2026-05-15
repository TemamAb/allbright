/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Exact colors from UPGRADING-TAURI-DESKTOP.MD
        'bg-primary': '#0B0F14',           // Background Primary (deep black-blue)
        'bg-secondary': '#151B23',         // Background Secondary (ash-black)
        'panel-surface': '#1C2430',        // Panel Surface (graphite ash)
        'border-color': '#2A3441',         // Borders (soft steel gray)
        
        // Metallic Blue Accent System (ELITE SIGNATURE)
        'heading-blue': '#4DA3FF',         // Primary Heading Blue
        'glow-blue': '#2F80FF',            // Glow Blue Accent
        'ai-signal-blue': '#00C2FF',       // AI Signal Blue
        'data-highlight-blue': '#5AB0FF',  // Data Highlight Blue
        
        // Status Colors
        'profit': '#00E676',               // Profit
        'warning': '#FFB020',              // Warning
        'risk': '#FF4D4F',                 // Risk
        
        // Legacy colors for backward compatibility during transition
        'grafana-bg': '#161819',
        'grafana-panel': '#1f1f1f', 
        'grafana-card': '#282a36',
        'grafana-ash': '#2d3748',
        'grafana-ash-light': '#4a5568',
        'grafana-text': '#e4e7eb',
        'grafana-text-dim': '#7f8c8d',
        'grafana-green': '#00f5a0',
        'grafana-yellow': '#ffaa00',
        'grafana-red': '#ff5f56',
        electric: 'hsl(148 100% 60%)',
        'electric/5': 'hsl(148 100% 60% / 0.05)',
        'electric/10': 'hsl(148 100% 60% / 0.1)',
        'electric/20': 'hsl(148 100% 60% / 0.2)',
        'electric/30': 'hsl(148 100% 60% / 0.3)',
        glass: 'hsl(220 20% 12% / 0.6)',
        'metallic-white': '#F5F7FA',
        'bright-blue': '#00A3FF',
        'neon-green': '#00FF94',
        'ash-black': '#262626',
        'ash-dark': '#333333',
        'ash-border': '#404040',
        'ash-muted': '#a0a0a0',
        'data-black': '#000000',
        'cyan-accent': '#3b82f6',
        'emerald-accent': '#56a64b',
        'success': '#56a64b',
        'warning': '#f2cc0c',
        'info': '#5794f2',
        'destructive': '#e02f44',
        'primary-accent': '#3b82f6',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'grafana-glow': '0 0 0 1px hsl(0 0% 100% / 0.1)',
      },
    },
  },
  plugins: [],
}

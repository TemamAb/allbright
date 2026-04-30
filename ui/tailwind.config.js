module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Grafana 100% Dark Palette
        'grafana-bg': '#161819',
        'grafana-panel': '#1f1f1f', 
        'grafana-card': '#282a36',
        'grafana-ash': '#2d3748',
        'grafana-ash-light': '#4a5568',
        'grafana-text': '#e4e7eb',
        'grafana-text-dim': '#7f8c8d',
        // Status colors (pure Grafana)
        'grafana-green': '#00f5a0',
        'grafana-yellow': '#ffaa00',
        'grafana-red': '#ff5f56',
        // Existing colors
        electric: 'hsl(148 100% 60%)',
        'electric/5': 'hsl(148 100% 60% / 0.05)',
        'electric/10': 'hsl(148 100% 60% / 0.1)',
        'electric/20': 'hsl(148 100% 60% / 0.2)',
        'electric/30': 'hsl(148 100% 60% / 0.3)',
        glass: 'hsl(220 20% 12% / 0.6)',
        'metallic-white': '#F5F7FA',
        'bright-blue': '#00A3FF',
        'neon-green': '#00FF94',
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

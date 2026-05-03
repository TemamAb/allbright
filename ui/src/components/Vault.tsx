import React from 'react';

export const Vault: React.FC = () => {
  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-2">Secure Vault</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted rounded">
          <p className="text-sm text-muted-foreground uppercase">Insurance Fund</p>
          <p className="text-2xl font-mono tabular-nums">0.00 ETH</p>
        </div>
      </div>
    </div>
  );
};

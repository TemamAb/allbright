export interface KPI {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  designTarget: number | string;
  comparison: 'gt' | 'lt' | 'eq' | 'positive_trajectory' | 'active' | 'nominal';
  status: 'good' | 'warn' | 'bad';
}

export interface KPICategory {
  id: string;
  label: string;
  weight: number;
  kpis: KPI[];
}

export interface GESState {
  ges: number;
  categories: {
    [key: string]: KPI[];
  };
  timestamp?: Date;
  blocksScanned?: number;
  opportunitiesDetected?: number;
  opportunitiesExecuted?: number;
  uptimeSeconds?: number;
}

export interface FullKPIState {
  categories: {
    [key: string]: KPI[];
  };
  ges: number;
  timestamp?: Date;
}

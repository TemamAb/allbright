// ui/src/types/kpi_audit.ts

export interface KpiAuditItem {
  id: number;
  name: string;
  category: string;
  benchmark: string;
  allbright: string;
  delta: string;
  status: 'above' | 'below' | 'equal';
  autoOpt: string;
}
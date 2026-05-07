// This file aggregates all specialist implementations
// and provides a unified interface for the Copilot service.

import { PerformanceSpecialist } from './specialists/performance'; // Assuming these are wrappers for Rust
import { EfficiencySpecialist } from './specialists/efficiency';   // Assuming these are wrappers for Rust
import { HealthSpecialist } from './specialists/health';         // Assuming these are wrappers for Rust
import { BribeOptimizationSpecialist } from './specialists/bribeOptimization'; // New TS specialist
import { DiagnosticSpecialist } from './specialists/diagnosticSpecialist'; // BSS-60

export interface SubsystemSpecialist {
  name(): string;
  category(): string;
  // tuneKpis now returns a structured object that includes KPI values and potentially action/impact
  tuneKpis(kpiData: any): Promise<any>; 
}

export const specialists: SubsystemSpecialist[] = [
  // Node.js wrappers for Rust specialists (assuming they exist or will be created)
  new PerformanceSpecialist(),
  new EfficiencySpecialist(),
  new HealthSpecialist(),
  // TypeScript-native specialists
  new BribeOptimizationSpecialist(),
  new DiagnosticSpecialist(),
  // Add other specialists here as they are implemented
];
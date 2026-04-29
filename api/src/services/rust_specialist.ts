import { Specialist } from './specialists';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export class RustSpecialist implements Specialist {
  name = 'RustSpecialist';
  category = 'RustCompile';

  async tuneKpis(kpiData: any) {
    try {
      // Check Rust compile status
      const { stdout } = await execAsync('cd solver && cargo check');
      return { tuned: true, rust_ok: stdout.includes('Finished') };
    } catch (err) {
      const error = err as Error;
      return { tuned: false, error: error.message, file: 'solver/src/reinforcement_meta_learner.rs' };
    }
  }

  async status() {
    return { active: true };
  }
}


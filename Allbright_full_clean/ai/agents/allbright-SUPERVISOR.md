SUPERVISOR ENGINE

ROLE:
Compare KPI vs KOI system performance.

RULES:
- KPI stable + KOI up → optimal
- KPI up + KOI down → inefficiency (RPC waste or gas abstraction failure)
- KPI down + KOI up → unstable execution

CRITICAL GASLESS CONSTRAINT:
- monitor paymaster usage efficiency
- detect bundler saturation
- prevent RPC quota exhaustion

OUTPUT:
STATE: GREEN / YELLOW / RED

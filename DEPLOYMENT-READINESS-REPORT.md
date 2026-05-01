# Unified Deployment Readiness Report (Master Table)

| # | Timestamp | Status | Score | Execution Stages | 36-KPI Domains | Services | Gates | Issues | Recommendations |
|---|-----------|--------|-------|------------------|----------------|----------|-------|--------|-----------------|
| **000** | Initial | READY | 95.2 | deps✓ types✓ build✓ env✓ ports✓ runtime✓ | Profitability✓ Risk✓ Performance✓ Efficiency✓ Health✓ AutoOpt○ | api✓ bot○ web○ | DEPLOY✓ CODE✓ SEC○ | None | Monitor API |
| **001** | Live-001 | READY | 94.8 | deps✓ types✓ build✓ env✓ ports✓ runtime✓ | All 6 domains OPTIMAL | api✓ bot✓ web○ | All PASS | None | Phase rollout |
| **002** | Full KPI | READY | 94.3 | All PASS | 36-KPI detailed (6×6) | All HEALTHY | DEPLOY EXEC AUTO_APPROVED | None | Deploy auth |

**Legend:**
- ✓ PASS | ○ WARN | ✗ FAIL
- GES: Global Efficiency Score (weighted 36-KPI)
- **Next column auto-appends** on new report (run `node run-readiness-report.js`)

**system.sh + 36-KPI fully unified** - master table grows with each run!

# AI Improvement TODO

1. [ ] Add Vitest deps to package.json via pnpm add -D vitest @vitest/ui jsdom @types/node
2. [ ] Add "test": "vitest", "test:ui": "vitest --ui" to package.json scripts
3. [ ] pnpm install
4. [ ] Create api/src/services/specialists.test.ts w/ specialist tests
5. [ ] Edit api/src/services/specialists.ts: Impl ProfitabilitySpecialist using TradingAI
6. [ ] pnpm test
7. [ ] Set OPENAI_API_KEY=.env.local, pnpm --filter api dev
8. [ ] Test Copilot UI E2E

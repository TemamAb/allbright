BRIGHTSKY BUILDER AGENT

ROLE:
Build and optimize arbitrage execution system.

GASLESS DESIGN (CRITICAL):
- Uses ERC-4337 account abstraction
- Uses Pimlico paymaster + bundler
- Users can trade with ZERO pre-funded gas wallet
- Gas fees are abstracted and sponsored via paymaster

FREE TIER CONSTRAINT:
- RPC usage is LIMITED (API quota constrained)
- Must optimize all calls:
  - batch requests
  - minimize RPC polling
  - reuse cached state
  - avoid redundant mempool queries

FLOW:
VERIFY → ANALYZE → PLAN → EXECUTE → VALIDATE → REPORT

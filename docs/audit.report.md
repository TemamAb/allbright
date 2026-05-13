Completed
.gitignore
developer
founder
Export PDF

100
A
Audit Detection Quality
Detection coverage across 1 contracts via static + AI analysis.

0
Critical
0
High
0
Medium
0
Low
Protocol Statistics
Contracts

0

Functions

0

External Calls

0

Scan Time

4.6s

Engine v10
standard
100% analyzed
0 AI calls
Report quality (for stakeholders)

Avg. confidence: 100%
Proven: 0
Likely: 0
Review: 0
Noise filtered: 0%
Findings pass line/snippet checks, noise filters, and confidence calibration. Low-confidence items are dropped or downgraded.

Security Architecture
How resilient is your protocol if something goes wrong?

40/100
Grade D

High risk architecture. Critical improvements required before deployment.

Emergency Pausability
0/20
✗ Has Pausable mechanism
✗ Pause covers critical functions
✗ Has emergency withdrawal mode
Access Control Architecture
0/20
✗ Uses role-based access control
✗ Has timelock on admin functions
✗ Multisig or governance controlled
Upgrade Safety
20/20
✓ Is immutable (no upgrade path)
✗ Upgrade requires authorization
✗ Upgrade has timelock protection
Oracle Security
20/20
✓ No oracle dependency detected
Circuit Breakers & Limits
0/20
✗ Has withdrawal rate limiting
✗ Has borrow or mint caps
✗ Has flash loan protection
Access Control & Key Risk
How much damage can a compromised admin key do?

Medium Key Risk
No Emergency Pause Mechanism
low
Protocol has no emergency stop capability. If an exploit begins, there is no way to halt it mid-attack.

💰 Dollar Risk

Without pause, an ongoing exploit cannot be stopped. Attacker can drain 100% of TVL before a fix can be deployed.

✅ Fix

Inherit from OpenZeppelin Pausable. Add whenNotPaused modifier to all value-transferring functions.

Dependency Vulnerabilities
Known CVEs in your project dependencies (via Google OSV)

Vulnerable dependency: web3@6.15.1

Known vulnerability (GHSA-5hr4-253g-cpx2)

medium
Vulnerable dependency: fastapi@0.109.0

Known vulnerability (PYSEC-2024-38)

medium
Vulnerable dependency: python-dotenv@1.0.1

Known vulnerability (GHSA-mf9w-mj56-hr94)

medium
Contract Interaction Map
Shows how your contracts connect to each other

Contract
Has vulnerabilities
Normal connection
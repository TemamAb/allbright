# 🔴 SECURITY INCIDENT RESPONSE: Secrets Exposure

**Date:** 2026-04-28  
**Severity:** CRITICAL  
**Type:** Secrets committed to repository (Private key, API keys)  
**Status:** MITIGATION IN PROGRESS

---

## Incident Summary

Production secrets were discovered committed to the allbright repository in the `.env` file:

| Secret | Risk Level | Status | Replacement Instructions |
|--------|-----------|--------|-------------------------|
| `PRIVATE_KEY` (Wallet) | **CRITICAL** | 🔄 Rotating | Generate new wallet via `cast wallet new` or MetaMask |
| `PIMLICO_API_KEY` | **HIGH** | 🔄 Rotating | Dashboard → API Keys → Create new |
| `OPENAI_API_KEY` | **MEDIUM** | 🔄 Rotating | Platform → API Keys → Delete old, create new |
| `WALLET_ADDRESS` | **LOW** | ✅ Deprecated | Derived from new private key |

---

## Immediate Actions Required (DO NOW)

### Step 1: Key Rotation (5 minutes)

**1.1 Generate New Wallet (CRITICAL)**
```bash
# Using Foundry
cast wallet new --interactive

# OR using MetaMask: Create new account, export private key
# IMPORTANT: Do NOT reuse the old wallet address. Create fresh.
```

Update `.env`:
```bash
WALLET_ADDRESS=0xYourNewGeneratedAddress
PRIVATE_KEY=0xYourNewPrivateKey66Chars
```

**1.2 Rotate Pimlico API Key**
- Visit https://pimlico.io/dashboard
- Delete compromised key
- Create new key with permissions: `paymaster:sponsor`, `bundler:send`
- Copy new key to `.env`: `PIMLICO_API_KEY=pim_your_new_key`

**1.3 Rotate OpenAI API Key**
- Visit https://platform.openai.com/api-keys
- Delete compromised key (`sk-proj-...`)
- Create new key
- Copy to `.env`: `OPENAI_API_KEY=sk-...`

---

### Step 2: Repository Cleanup (10 minutes)

**2.1 Remove secrets from git history**

⚠️  **WARNING:** This rewrites history. Coordinate with team before pushing.

```bash
# Install BFG Repo Cleaner
curl -L https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -o bfg.jar

# Make bare clone
git clone --mirror file://$PWD allbright-mirror.git
cd allbright-mirror.git

# Remove all .env files from history
java -jar ../bfg.jar --delete-files .env

# Clean up and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Alternative (native git):**
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Remove dangling commits
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**2.2 Verify secrets removed**
```bash
# Search for exposed patterns in history
git log -p --all -S 'PRIVATE_KEY' | head -20
git log -p --all -S 'pim_ffA2TQeV' | head -20

# Check for new private key patterns (0x followed by 64 hex)
git log -p --all -E '0x[a-fA-F0-9]{64}' | head -20
```

**2.3 Add to .gitignore (verify already present)**
```gitignore
# Environment files
.env
.env.local
.env.*.local
```

---

### Step 3: Deploy Clean Version (15 minutes)

**3.1 Commit clean environment**
```bash
git add .env.example
git add SECURITY_INCIDENT_RESPONSE.md
git commit -m "🔒 security: sanitize .env, rotate exposed secrets

- Remove live secrets from repository
- Create .env.example template
- Document incident response procedures
- Add secret rotation checklist

🚨 ACTION REQUIRED: All developers must rotate keys before deploying"
```

**3.2 Deploy to staging first**
```bash
# Render.com: Update environment variables in dashboard
# 1. Navigate to Service → Environment
# 2. Replace all old values with newly generated ones
# 3. Deploy to staging branch
# 4. Verify health: https://staging-allbright.onrender.com/api/health
```

**3.3 Verify no live trading on old keys**
```bash
# Check Etherscan for activity from old wallet
# https://etherscan.io/address/0x748Aa8ee067585F5bd02f0988eF6E71f2d662751
# If any transactions exist post-incident, investigate immediately
```

---

## Post-Incident Actions

### Monitoring for Abuse
- [ ] Set up alerts for old wallet address (any ETH movement → immediate notification)
- [ ] Monitor Pimlico dashboard for unusual API usage (spikes, bundler abuse)
- [ ] Review OpenAI usage for unexpected charges
- [ ] Audit logs for unauthorized access attempts using old credentials

### Prevention
- [ ] Enable pre-commit hook: `pre-commit` with `detect-secrets` or `git-secrets`
- [ ] Add `truffleHog` or `gitleaks` to CI pipeline (fail on secret detection)
- [ ] Rotate all credentials every 90 days (automated calendar reminder)
- [ ] Store production secrets ONLY in cloud secret manager (AWS Secrets Manager, Render env vars)
- [ ] Add SECRET_SCAN_IGNORE_PATTERNS to CI for false positives

### Documentation
- [x] Create `SECURITY_INCIDENT_RESPONSE.md` (this file)
- [ ] Add secret rotation SOP to `docs/operational-runbooks.md`
- [ ] Update onboarding guide for new developers (never use real keys in dev)
- [ ] Document emergency rollback procedure

---

## Verification Checklist

Before declaring incident resolved:

- [ ] All 4 keys rotated (wallet, pimlico, openai, profit wallet if applicable)
- [ ] Old keys revoked/deleted from provider dashboards
- [ ] `.env` removed from git history on all branches (verify with `git log -p --all -S "PRIVATE_KEY"`)
- [ ] No secrets in repository (run `gitleaks detect --source .`)
- [ ] Staging deployment tested with new keys
- [ ] Health check passes: `curl https://staging/api/health`
- [ ] Smoke test: Execute 1 shadow-mode trade (no real funds)
- [ ] Monitoring alerts configured (Datadog/PagerDuty/Slack)
- [ ] Team notified of incident and changes
- [ ] Post-mortem scheduled (within 7 days)

---

## Timeline

| Time | Action | Owner |
|------|--------|-------|
| T+0min | Incident identified, .env sanitized | Engineering |
| T+15min | Keys rotated (wallet, Pimlico, OpenAI) | Security |
| T+30min | Repository history purged (BFG) | DevOps |
| T+45min | Staging deployment with new keys | Engineering |
| T+60min | Smoke test passed, monitoring verified | QA |
| T+24h | Full production rollout (if staging stable) | Engineering |
| T+7d | Post-mortem completed, preventive measures in place | Team |

---

## Contact

**Security Lead:** [Your Name]  
**On-Call:** [PagerDuty/OpsGenie Link]  
**Incident Channel:** #security-incident (Slack)

---

**🚨 REMEMBER:** No real funds should be deployed until staging validation complete and all keys verified rotated.

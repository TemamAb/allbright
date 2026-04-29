#!/bin/bash
set -e

echo "─── [GATE KEEPER SYSTEM] DEPLOYMENT APPROVAL WORKFLOW ───"
echo "🔐 GATE KEEPER PROTOCOL v2.0 - MULTI-LAYER APPROVAL REQUIRED"
echo ""

# GATE KEEPER APPROVAL SYSTEM
# Each gate requires explicit approval before proceeding

# GATE 1: CODE QUALITY GATE
echo "🚪 GATE 1: CODE QUALITY APPROVAL"
echo "   Requirements: Compilation, Linting, Security Audit"
read -p "   ✅ Approve Code Quality Gate? (yes/no): " code_approval
if [[ "$code_approval" != "yes" ]]; then
    echo "❌ CODE QUALITY GATE REJECTED - Deployment blocked"
    exit 1
fi
echo "   ✓ Code Quality Gate APPROVED"
echo ""

# GATE 2: INFRASTRUCTURE READINESS GATE
echo "🚪 GATE 2: INFRASTRUCTURE READINESS APPROVAL"
echo "   Requirements: Environment Config, Database, Networking"
read -p "   ✅ Approve Infrastructure Readiness Gate? (yes/no): " infra_approval
if [[ "$infra_approval" != "yes" ]]; then
    echo "❌ INFRASTRUCTURE READINESS GATE REJECTED - Deployment blocked"
    exit 1
fi
echo "   ✓ Infrastructure Readiness Gate APPROVED"
echo ""

# GATE 3: SECURITY APPROVAL GATE
echo "🚪 GATE 3: SECURITY APPROVAL GATE"
echo "   Requirements: Secret Management, Access Control, Audit Logs"
read -p "   ✅ Approve Security Gate? (yes/no): " security_approval
if [[ "$security_approval" != "yes" ]]; then
    echo "❌ SECURITY APPROVAL GATE REJECTED - Deployment blocked"
    exit 1
fi
echo "   ✓ Security Gate APPROVED"
echo ""

# GATE 4: PERFORMANCE BENCHMARK GATE
echo "🚪 GATE 4: PERFORMANCE BENCHMARK APPROVAL"
echo "   Requirements: KPI Targets Met, Scalability Tested, Benchmarks Validated"
read -p "   ✅ Approve Performance Benchmark Gate? (yes/no): " perf_approval
if [[ "$perf_approval" != "yes" ]]; then
    echo "❌ PERFORMANCE BENCHMARK GATE REJECTED - Deployment blocked"
    exit 1
fi
echo "   ✓ Performance Benchmark Gate APPROVED"
echo ""

# GATE 5: BUSINESS APPROVAL GATE (FINAL AUTHORIZATION)
echo "🚪 GATE 5: BUSINESS APPROVAL GATE - FINAL AUTHORIZATION"
echo "   Requirements: ROI Validation, Risk Assessment, Go-Live Decision"
echo "   ⚠️  This is the FINAL GATE - Approval will initiate deployment"
read -p "   ✅ FINAL APPROVAL: Proceed with deployment? (yes/no): " business_approval
if [[ "$business_approval" != "yes" ]]; then
    echo "❌ BUSINESS APPROVAL GATE REJECTED - Deployment cancelled"
    exit 1
fi
echo "   ✓ Business Approval Gate APPROVED"
echo ""

echo "🎉 ALL GATES APPROVED - DEPLOYMENT AUTHORIZED"
echo "🔐 GATE KEEPER PROTOCOL: DEPLOYMENT CLEARED FOR LAUNCH"
echo ""

# Record approvals in audit log
echo "[$(date)] DEPLOYMENT AUTHORIZED - All gates approved by human operators" >> /var/log/brightsky/audit.log

# Display deployment authorization certificate
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                          DEPLOYMENT AUTHORIZATION CERTIFICATE                 ║"
echo "╠══════════════════════════════════════════════════════════════════════════════╣"
echo "║ Gates Approved: ✅ Code Quality  ✅ Infrastructure  ✅ Security            ║"
echo "║                  ✅ Performance   ✅ Business                               ║"
echo "║                                                                            ║"
echo "║ Deployment Status: AUTHORIZED FOR PRODUCTION                               ║"
echo "║ Authorization Code: $(openssl rand -hex 8 | tr '[:lower:]' '[:upper:]')                    ║"
echo "║ Authorized By: Human Operators                                             ║"
echo "║ Timestamp: $(date)                                               ║"
echo "║                                                                            ║"
echo "║ ⚠️  REMEMBER: With great power comes great responsibility                  ║"
echo "║    Monitor closely and be prepared to rollback if issues arise.           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "─── [BSS-38] PRE-FLIGHT INTEGRITY CHECK ───"

# 0. BSS-39: Compilation Integrity Check (BEFORE anything else)
# This specialist ensures the code compiles BEFORE deployment
if [[ "$*" != *"migrate"* ]]; then
    echo "─── [BSS-39] COMPILATION GUARD ───"
    if command -v cargo &> /dev/null; then
        echo "Running cargo build --release..."
        if cargo build --release --bin brightsky 2>&1 | tee /tmp/cargo-output.log; then
            echo "✓ [BSS-39] Rust Code Compiles Successfully"
        else
            echo "ERR: [BSS-39] COMPILATION FAILED"
            echo "Last 20 lines of compilation errors:"
            tail -20 /tmp/cargo-output.log
            exit 1
        fi
    else
        echo "WARN: cargo not installed - skipping compilation check"
    fi
fi

# 1. Verify Critical Secrets (Context-Aware)
if [[ "$*" == *"migrate"* ]]; then
    echo "INFO: Migration command detected. Relaxing validation to database only."
    REQUIRED_VARS=("DATABASE_URL")
else
    REQUIRED_VARS=("DATABASE_URL" "RPC_ENDPOINT" "PIMLICO_API_KEY")
fi

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERR: Missing critical environment variable: $var"
        exit 1
    fi
done
echo "✓ Environment Variables Validated"

# 1.5 Verify Port Isolation (BSS-38)
if [ "$PORT" == "$INTERNAL_BRIDGE_PORT" ] && [ -n "$PORT" ]; then
    echo "ERR: Port conflict detected. PORT and INTERNAL_BRIDGE_PORT cannot be the same ($PORT)."
    exit 1
fi
echo "✓ Port Isolation Verified"

# 2.5 Verify Configuration Integrity (Added for drift detection)
if [ -n "$PIMLICO_API_KEY" ]; then
    if [[ ${#PIMLICO_API_KEY} -lt 10 ]]; then
        echo "ERR: PIMLICO_API_KEY appears too short (length ${#PIMLICO_API_KEY})"
        exit 1
    fi
fi

if [ -n "$RPC_ENDPOINT" ]; then
    if [[ ! $RPC_ENDPOINT =~ ^https?:// ]]; then
        echo "ERR: RPC_ENDPOINT must start with http:// or https://"
        exit 1
    fi
fi
echo "✓ Configuration Integrity Verified"

# 2. Verify Database Connectivity
DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
DB_PORT=$(echo $DATABASE_URL | sed -e 's|.*:||' -e 's|/.*||')
if ! nc -z -w 5 "$DB_HOST" "${DB_PORT:-5432}"; then
    echo "ERR: Database connection failed at $DB_HOST"
    exit 1
fi
echo "✓ Database Reachable"

# 3. Verify Binary Integrity
if [[ "$*" != *"migrate"* ]]; then
    if [ ! -f "/usr/local/bin/brightsky-solver" ]; then
        echo "ERR: High-speed solver binary missing from OCI layer"
        exit 1
    fi
    echo "✓ Binary Integrity Confirmed"
fi

exec "$@"
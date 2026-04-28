#!/bin/bash
# BrightSky FlashExecutor Deployment Script
# Deploys FlashExecutor.sol to Base chain for Pimlico paymaster integration
set -e

echo "🚀 Deploying FlashExecutor.sol to Base (Chain 8453)"

# Environment variables
PRIVATE_KEY="${PRIVATE_KEY:-0d2a2abbec92cd87ad5dfa60a75bce66d6b16369456ea132aad152bd28c0aebe}"
RPC_URL="${RPC_ENDPOINT:-https://base.llamarpc.com}"
AAVE_POOL_BASE="0xA238Dd80C259a72e81d7e4664a9801593F98d1c5c"  # Aave V3 Pool on Base
UNISWAP_ROUTER_BASE="0x2626664c2603336E57B271c5C0b26F421741e4815"  # Uniswap V3 SwapRouter on Base

# Check if forge is available (Foundry)
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found. Please install Foundry:"
    echo "curl -L https://foundry.paradigm.xyz | bash"
    echo "foundryup"
    exit 1
fi

# Create deployment script
cat > deploy_flash_executor.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../flashloan/FlashExecutor.sol";

contract DeployFlashExecutor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address aavePool = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5c;
        address uniswapRouter = 0x2626664c2603336E57B271c5C0b26F421741e4815;

        FlashExecutor flashExecutor = new FlashExecutor(aavePool, uniswapRouter);

        vm.stopBroadcast();

        console.log("FlashExecutor deployed at:", address(flashExecutor));
    }
}
EOF

# Set RPC URL for deployment
export ETH_RPC_URL="$RPC_URL"

# Deploy using Foundry
echo "📦 Deploying contract..."
DEPLOY_OUTPUT=$(forge script deploy_flash_executor.sol --private-key "$PRIVATE_KEY" --broadcast --rpc-url "$RPC_URL" --chain 8453)

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "FlashExecutor deployed at:" | awk '{print $NF}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Deployment failed"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "✅ FlashExecutor deployed successfully!"
echo "📍 Contract Address: $CONTRACT_ADDRESS"

# Update .env file
if [ -f ".env" ]; then
    # Remove existing FLASH_EXECUTOR_ADDRESS if present
    sed -i '/^FLASH_EXECUTOR_ADDRESS=/d' .env
    # Add new address
    echo "FLASH_EXECUTOR_ADDRESS=$CONTRACT_ADDRESS" >> .env
    echo "✅ Updated .env with FLASH_EXECUTOR_ADDRESS=$CONTRACT_ADDRESS"
else
    echo "⚠️  .env file not found. Please manually set:"
    echo "FLASH_EXECUTOR_ADDRESS=$CONTRACT_ADDRESS"
fi

# Clean up
rm deploy_flash_executor.sol

echo "🎉 Deployment complete! Ready for Pimlico paymaster arbitrage."
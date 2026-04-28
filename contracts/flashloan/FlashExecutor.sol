// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

/// @title BrightSky FlashExecutor
/// @notice Gasless arbitrage executor using Pimlico paymaster + ERC-4337
/// @dev Designed for account abstraction - zero balance required
contract FlashExecutor {
    address public immutable owner;
    IPool public immutable aavePool;
    ISwapRouter public immutable uniswapRouter;

    // Protocol identifiers for multi-hop arbitrage
    enum Protocol { UNISWAP_V3, CURVE, BALANCER, AAVE_V3 }

    struct ArbitrageParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        Protocol[] protocols;
        bytes[] swapData; // Encoded swap instructions for each protocol
        uint256 minProfit; // Minimum profit threshold
    }

    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 profit,
        uint256 gasCost
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _aavePool, address _uniswapRouter) {
        owner = msg.sender;
        aavePool = IPool(_aavePool);
        uniswapRouter = ISwapRouter(_uniswapRouter);
    }

    /// @notice Main entry point for flash loan arbitrage
    /// @dev Called by Pimlico bundler via ERC-4337 UserOperation
    function executeFlashArbitrage(
        ArbitrageParams calldata params
    ) external returns (uint256 profit) {
        require(params.amountIn > 0, "Invalid amount");

        // Record initial balance for profit calculation
        uint256 initialBalance = IERC20(params.tokenOut).balanceOf(address(this));

        // Execute flash loan
        aavePool.flashLoan(
            address(this),
            params.tokenIn,
            params.amountIn,
            params.protocols,
            address(this),
            abi.encode(params),
            0 // referral code
        );

        // Calculate profit after flash loan repayment
        uint256 finalBalance = IERC20(params.tokenOut).balanceOf(address(this));
        profit = finalBalance - initialBalance;

        require(profit >= params.minProfit, "Insufficient profit");

        emit ArbitrageExecuted(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            profit,
            0 // Gas cost tracked externally
        );

        return profit;
    }

    /// @notice Aave flash loan callback
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == address(aavePool), "Only Aave pool");
        require(initiator == address(this), "Invalid initiator");

        ArbitrageParams memory arbParams = abi.decode(params, (ArbitrageParams));

        // Execute arbitrage across protocols
        uint256 amountOut = _executeArbitrage(arbParams);

        // Ensure we have enough to repay flash loan
        uint256 totalDebt = amount + premium;
        require(amountOut >= totalDebt, "Insufficient funds to repay");

        // Approve repayment
        IERC20(asset).approve(address(aavePool), totalDebt);

        return true;
    }

    /// @notice Execute multi-protocol arbitrage
    function _executeArbitrage(
        ArbitrageParams memory params
    ) internal returns (uint256) {
        uint256 currentAmount = params.amountIn;

        for (uint256 i = 0; i < params.protocols.length; i++) {
            if (params.protocols[i] == Protocol.UNISWAP_V3) {
                currentAmount = _swapUniswapV3(
                    params.tokenIn,
                    params.tokenOut,
                    currentAmount,
                    params.swapData[i]
                );
            } else if (params.protocols[i] == Protocol.CURVE) {
                currentAmount = _swapCurve(
                    params.tokenIn,
                    params.tokenOut,
                    currentAmount,
                    params.swapData[i]
                );
            } else if (params.protocols[i] == Protocol.BALANCER) {
                currentAmount = _swapBalancer(
                    params.tokenIn,
                    params.tokenOut,
                    currentAmount,
                    params.swapData[i]
                );
            }
        }

        return currentAmount;
    }

    /// @notice Uniswap V3 swap implementation
    function _swapUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes memory swapData
    ) internal returns (uint256 amountOut) {
        (uint24 fee, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) = abi.decode(
            swapData,
            (uint24, uint256, uint160)
        );

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        return uniswapRouter.exactInputSingle(params);
    }

    /// @notice Curve swap implementation (simplified)
    function _swapCurve(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes memory swapData
    ) internal returns (uint256) {
        // Implementation would decode curve pool address and call exchange
        // For now, return amountIn (placeholder)
        return amountIn;
    }

    /// @notice Balancer swap implementation (simplified)
    function _swapBalancer(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes memory swapData
    ) internal returns (uint256) {
        // Implementation would decode balancer vault and batch swap
        // For now, return amountIn (placeholder)
        return amountIn;
    }

    /// @notice Emergency withdrawal by owner
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    /// @notice Check contract balance
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Receive ETH
    receive() external payable {}
}
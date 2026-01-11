# Arbitrum Sepolia Deployment Guide

## Prerequisites
- .env must include:
  - PRIVATE_KEY
  - ARBITRUM_SEPOLIA_RPC_URL
  - ARBISCAN_API_KEY (for verification)
- Optional: CMC_API_KEY for gas reporting
- Hardhat network: arbitrumSepolia

## Sequence Overview
- Deploy DPToken
- Deploy CERTIFICATE (NFT Minting)
- Deploy REDEEM
- Deploy STAKE (NFT Staking)
- Deploy StableStaking (USDT staking, DPToken lock)
- Deploy GovernanceDAO
- Wire integrations and roles

## Environment Variables
- DP_RECEIVER: initial DPToken receiver
- DP_TAX: tax wallet
- DP_BUY_TAX_PPM: buy tax in PPM (e.g., 25000)
- PAYMENT_POOL: payout pool address
- REWARD_POOL: reward pool address
- AUTH_SIGNER: authorized signer address
- USDT_ADDRESS: Arbitrum Sepolia USDT address (optional; if unset, local simulation uses mock USDT)
- STAKING_POOL: staking pool address
- LOCKING_POOL: locking pool address

## Deploy and Wire (Sepolia)
1) Compile
   - npm run compile
2) Run sequenced deployment
   - Uses scripts/deploy-sequence.js
   - Command:
     - npx hardhat run scripts/deploy-sequence.js --network arbitrumSepolia
   - Provide USDT_ADDRESS in .env for real USDT; otherwise, the script is suitable for dry-run on local only
3) Verify contracts (examples)
   - npm run verify:arbSepolia <DPToken_address> "<DP_RECEIVER>" "<DP_TAX>" "<DP_BUY_TAX_PPM>"
   - npm run verify:arbSepolia <StableStaking_address> "<USDT_ADDRESS>" "<STAKING_POOL>" "<DPToken_address>" "<LOCKING_POOL>" "<AUTH_SIGNER>"
   - npm run verify:arbSepolia <GovernanceDAO_address>
   - npm run verify:arbSepolia <CERTIFICATE_address>
   - npm run verify:arbSepolia <REDEEM_address>
   - npm run verify:arbSepolia <STAKE_address>

## Wiring Details
- DPToken → setStakingContract(StableStaking, true)
- CERTIFICATE → paymentToken(DPToken), paymentPool(PAYMENT_POOL), redeem(REDEEM), staking(STAKE)
- REDEEM → NFE(CERTIFICATE), DPMC(DPToken), payout(PAYMENT_POOL)
- STAKE → NFE(CERTIFICATE), DPMC(DPToken), reward(REWARD_POOL), signer(AUTH_SIGNER)
- StableStaking → constructor(USDT_ADDRESS, STAKING_POOL, DPToken, LOCKING_POOL, AUTH_SIGNER), addOrRemoveAdmin(STAKING_POOL, true)
- GovernanceDAO → tokenLock(DPToken), usdtStake(StableStaking), usdcStake(StableStaking or alternative)

## Notes
- Fund PAYMENT_POOL and STAKING_POOL appropriately with test tokens.
- Ensure allowances are set to enable staking payouts and certificate mint payments if required.


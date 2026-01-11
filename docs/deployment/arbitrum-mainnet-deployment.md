# Arbitrum Mainnet Deployment Guide

## Prerequisites
- Arbitrum RPC and account
  - .env: PRIVATE_KEY, ARBITRUM_RPC_URL, ARBISCAN_API_KEY
- Optional: CMC_API_KEY for gas reporting
- Hardhat configured networks: arbitrumOne

## Sequence Overview
- Deploy DPToken
- Deploy CERTIFICATE (NFT Minting)
- Deploy REDEEM
- Deploy STAKE (NFT Staking)
- Deploy StableStaking (USDT staking, DPToken lock)
- Deploy GovernanceDAO
- Wire integrations and roles

## Environment Variables
- DP_RECEIVER: initial receiver address for DPToken mint
- DP_TAX: tax wallet address
- DP_BUY_TAX_PPM: buy tax in PPM (e.g., 25000)
- PAYMENT_POOL: payout pool address
- REWARD_POOL: reward pool address for STAKE
- AUTH_SIGNER: authorized signer for STAKE and StableStaking
- USDT_ADDRESS: mainnet USDT address (required on mainnet)
- STAKING_POOL: staking pool address for StableStaking
- LOCKING_POOL: locking pool address for StableStaking

## Deploy and Wire (Mainnet)
1) Export .env with required values
2) Compile
   - npm run compile
3) Run sequenced deployment
   - CONTRACT deployments are orchestrated by scripts/deploy-sequence.js
   - Command:
     - npm run deploy:arbOne
     - Ensure .env has USDT_ADDRESS set for mainnet
4) Verify contracts (examples)
   - npm run verify:arbOne <DPToken_address> "<DP_RECEIVER>" "<DP_TAX>" "<DP_BUY_TAX_PPM>"
   - npm run verify:arbOne <StableStaking_address> "<USDT_ADDRESS>" "<STAKING_POOL>" "<DPToken_address>" "<LOCKING_POOL>" "<AUTH_SIGNER>"
   - npm run verify:arbOne <GovernanceDAO_address>
   - npm run verify:arbOne <CERTIFICATE_address>
   - npm run verify:arbOne <REDEEM_address>
   - npm run verify:arbOne <STAKE_address>

## Wiring Details
- DPToken
  - setStakingContract(StableStaking, true)
- CERTIFICATE
  - updatePaymentToken(DPToken)
  - updatePaymentPool(PAYMENT_POOL)
  - updateRedeem(REDEEM)
  - updateStaking(STAKE)
- REDEEM
  - updateNFEaddress(CERTIFICATE)
  - updateDPMCaddress(DPToken)
  - updatePayoutAddress(PAYMENT_POOL)
- STAKE
  - updateNFEaddress(CERTIFICATE)
  - updateDPMCaddress(DPToken)
  - updateRewardAddress(REWARD_POOL)
  - updateSignerAddress(AUTH_SIGNER)
- StableStaking
  - constructor(USDT_ADDRESS, STAKING_POOL, DPToken, LOCKING_POOL, AUTH_SIGNER)
  - addOrRemoveAdmin(STAKING_POOL, true)
  - Pool funding and allowance must be set externally
- GovernanceDAO
  - updateTokenLock(DPToken)
  - updateUsdtStake(StableStaking)
  - updateUsdcStake(StableStaking or alternative)

## Simulation (Local)
- Without USDT_ADDRESS, the script deploys a mock USDT for local validation
- Command:
  - npm run deploy:local
  - Review the integration summary logs

## Post-Deployment Checks
- npm run test
- npm run coverage
- Inspect gas-analysis/gas-report.md


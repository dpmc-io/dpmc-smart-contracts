# Behavior & Economics

This document summarizes configurable parameters, pool metrics, token economics, and governance linkages with direct code references.

## APR/Penalty Parameters (STAKE)
- APR configuration and usage:
  - Defaults set in constructor: [nft-staking-smart-contract.sol:L949-L952](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L949-L952)
  - Updates via admin: [nft-staking-smart-contract.sol:L1092-L1094](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1092-L1094)
  - Applied during staking and unstaking: [nft-staking-smart-contract.sol:L1420-L1421](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1420-L1421), [nft-staking-smart-contract.sol:L1492-L1495](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1492-L1495)
- Penalty configuration and usage:
  - Defaults set in constructor: [nft-staking-smart-contract.sol:L953-L956](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L953-L956)
  - Updates via admin: [nft-staking-smart-contract.sol:L1110](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1110)
  - Applied in reward calculations: [nft-staking-smart-contract.sol:L1255](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1255)
- Additional caps and toggles:
  - MIN_TOKEN_TO_STAKE: [nft-staking-smart-contract.sol:L940](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L940), [nft-staking-smart-contract.sol:L1321-L1323](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1321-L1323)
  - FORCED_UNSTAKE_IN_DAYS: [nft-staking-smart-contract.sol:L948](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L948)
  - RESTRICTED_RE_STAKING: [nft-staking-smart-contract.sol:L940](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L940), [nft-staking-smart-contract.sol:L1115](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1115)

## Pool Metrics
- STAKE
  - totalStakingPool and cap:
    - Declaration and cap: [nft-staking-smart-contract.sol:L860-L861](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L860-L861)
    - Updates on stake/unstake/forceStop: [nft-staking-smart-contract.sol:L1356](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1356), [nft-staking-smart-contract.sol:L1538](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1538), [nft-staking-smart-contract.sol:L1379](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1379)
    - Stake admissions respect cap: [nft-staking-smart-contract.sol:L1275-L1277](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1275-L1277)
- StableStaking
  - PoolMetrics struct and updates:
    - Definition: [stable-staking-smart-contract.sol:L569](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L569)
    - Increments on stake: [stable-staking-smart-contract.sol:L1282-L1283](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1282-L1283)
    - Decrements on forceStop and withdraw: [stable-staking-smart-contract.sol:L1433-L1444](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1433-L1444), [stable-staking-smart-contract.sol:L1492-L1504](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1492-L1504)
  - User metrics (totalStaked, stakeCount, totalLocked) updated on lifecycle changes:
    - Examples: [stable-staking-smart-contract.sol:L1439](contracts/stable-staking-smart-contract.sol#L1439), [stable-staking-smart-contract.sol:L1498](contracts/stable-staking-smart-contract.sol#L1498), [stable-staking-smart-contract.sol:L1682-L1702](contracts/stable-staking-smart-contract.sol#L1682-L1702)

## Token Economics (DPToken)
- Paused behavior, whitelist/Uniswap routing, and buy tax handled within transfer/transferFrom logic; staking contract authorization gates locked-balance updates.
- Staking contract authorization:
  - setStakingContract(address,bool): [dp-token-smart-contract.sol:L880-L899](dpmc-smart-contracts/contracts/dp-token-smart-contract.sol#L880-L899)
- Locked amount updates limited to authorized staking contracts:
  - updateLockedAmount: [dp-token-smart-contract.sol:L839-L875](dpmc-smart-contracts/contracts/dp-token-smart-contract.sol#L839-L875)

## Governance Links
- DAO references to staking contracts (USDT/USDC) and token lock:
  - updateTokenLock: [governance-dao-smart-contract.sol:L344-L355](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L344-L355)
  - updateUsdtStake: [governance-dao-smart-contract.sol:L356-L370](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L356-L370)
  - updateUsdcStake: [governance-dao-smart-contract.sol:L364-L384](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L364-L384)
- Tier calculation via tokenLock and locked balance:
  - getTier and thresholds: [governance-dao-smart-contract.sol:L411-L446](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L411-L446), [governance-dao-smart-contract.sol:L378-L404](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L378-L404)

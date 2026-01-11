# Auditor Per-Contract Checklist

This document lists entrypoints, modifiers, external interactions, events, and signature validation points for core contracts. Links jump directly to source lines.

## STAKE (NFT Staking)
- Entrypoints
  - staking: external, whenNotPaused, nonReentrant [nft-staking-smart-contract.sol:L1269-L1369](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1269-L1369)
  - unStaking: external, nonReentrant [nft-staking-smart-contract.sol:L1463-L1550](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1463-L1550)
  - forceStop: external, onlyAdmin, nonReentrant [nft-staking-smart-contract.sol:L1371-L1394](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1371-L1394)
  - pause/unpause: external, onlyAdmin [nft-staking-smart-contract.sol:L960-L965](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L960-L965)
- Modifiers
  - onlyAdmin, whenNotPaused, nonReentrant [nft-staking-smart-contract.sol:L1008-L1017](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1008-L1017)
- External interactions
  - IERC721.safeTransferFrom (stake/unStake/forceStop) [nft-staking-smart-contract.sol:L1328-L1332](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1328-L1332), [nft-staking-smart-contract.sol:L1381-L1385](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1381-L1385)
  - IERC20.transferFrom (reward payout) [nft-staking-smart-contract.sol:L1531-L1534](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1531-L1534)
  - INFE721.tokenValue (pricing) [nft-staking-smart-contract.sol:L1534-L1537](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1534-L1537)
- Signature validation
  - ECDSA.recover helper [nft-staking-smart-contract.sol:L1002-L1006](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1002-L1006)
  - staking digest and signer check [nft-staking-smart-contract.sol:L1299-L1307](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1299-L1307)
  - unStaking digest and signer check [nft-staking-smart-contract.sol:L1474](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1474)
- Events
  - Staking, UnStaking, ForceStop [nft-staking-smart-contract.sol:L911-L963](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L911-L963)
  - Emissions: staking [nft-staking-smart-contract.sol:L1425-L1446](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1425-L1446), UnStaking [nft-staking-smart-contract.sol:L1542-L1550](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1542-L1550), ForceStop [nft-staking-smart-contract.sol:L1347-L1358](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1347-L1358)

## StableStaking (ERC20 Staking)
- Entrypoints
  - stake: external, whenNotPaused, nonReentrant [stable-staking-smart-contract.sol:L1334-L1367](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1334-L1367)
  - requestWithdrawPrincipal: external, nonReentrant [stable-staking-smart-contract.sol:L1460-L1522](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1460-L1522)
  - withdrawPrincipal: external, nonReentrant [stable-staking-smart-contract.sol:L1524-L1576](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1524-L1576)
  - withdrawInterest: external, nonReentrant [stable-staking-smart-contract.sol:L1578-L1660](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1578-L1660)
  - forceStop: external, onlyAdmin, nonReentrant [stable-staking-smart-contract.sol:L1410-L1451](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1410-L1451)
- Modifiers
  - onlyAdmin, whenNotPaused, nonReentrant, onlyValidAddress (for address updates) [stable-staking-smart-contract.sol:L847-L859](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L847-L859)
- External interactions
  - SafeERC20.safeTransferFrom for staking/locking [stable-staking-smart-contract.sol:L1378-L1390](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1378-L1390)
  - tokenLock.updateLockedAmount [stable-staking-smart-contract.sol:L782-L789](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L782-L789)
  - stakingToken.safeTransferFrom for withdrawals [stable-staking-smart-contract.sol:L1555-L1561](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1555-L1561)
- Signature validation
  - ECDSA.recover helper [stable-staking-smart-contract.sol:L818-L827](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L818-L827)
  - stake digest and signer check [stable-staking-smart-contract.sol:L1339-L1356](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1339-L1356)
  - withdraw principal/interest digests and signer checks [stable-staking-smart-contract.sol:L1502-L1504](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1502-L1504), [stable-staking-smart-contract.sol:L1566-L1568](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1566-L1568), [stable-staking-smart-contract.sol:L1638](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1638)
- Events
  - ForceStop [stable-staking-smart-contract.sol:L1444-L1451](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1444-L1451)
  - WithdrawPrincipalRequested [stable-staking-smart-contract.sol:L1513-L1521](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1513-L1521)
  - Numerous parameter update events (tiers, thresholds, tokens) throughout the file

## REDEEM (NFT Redeem)
- Entrypoints
  - redeem: external, nonReentrant [nft-redeem-smart-contract.sol:L97-L113](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L97-L113)
  - onERC721Received: public (IERC721Receiver) [nft-redeem-smart-contract.sol:L51-L54](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L51-L54)
- Modifiers
  - onlyAdmin for redeembility and blacklists, onlyOwner for address updates [nft-redeem-smart-contract.sol:L56-L94](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L56-L94)
- External interactions
  - IERC721.safeTransferFrom burn to DEAD [nft-redeem-smart-contract.sol:L107](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L107)
  - IERC20.transferFrom payout [nft-redeem-smart-contract.sol:L110](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L110)
  - INFE721.tokenValue [nft-redeem-smart-contract.sol:L103-L105](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L103-L105)
- Events
  - Redeem, admin updates [nft-redeem-smart-contract.sol:L28-L38](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L28-L38)

## DPToken (ERC20)
- Entrypoints
  - transfer, transferFrom (overridden with paused/whitelist and buy tax logic)
  - setStakingContract: onlyOwner [dp-token-smart-contract.sol:L880-L899](dpmc-smart-contracts/contracts/dp-token-smart-contract.sol#L880-L899)
  - updateLockedAmount: onlyStakingContract [dp-token-smart-contract.sol:L839-L875](dpmc-smart-contracts/contracts/dp-token-smart-contract.sol#L839-L875)
- Modifiers
  - onlyOwner, onlyStakingContract
- External interactions
  - None beyond ERC20 patterns; staking contract authorizations affect who can update locked amounts
- Events
  - TokenLockedUpdated, BuyTaxPercentageUpdated, Router/Manager updates [dp-token-smart-contract.sol:L791-L816](dpmc-smart-contracts/contracts/dp-token-smart-contract.sol#L791-L816)

## GovernanceDAO
- Entrypoints
  - addOrRemoveAdmin: onlyOwner
  - updateTokenLock: onlyAdmin [governance-dao-smart-contract.sol:L344-L355](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L344-L355)
  - updateUsdtStake: onlyAdmin [governance-dao-smart-contract.sol:L359-L370](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L359-L370)
  - updateUsdcStake: onlyAdmin [governance-dao-smart-contract.sol:L373-L384](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L373-L384)
- Modifiers
  - onlyAdmin, onlyOwner
- External interactions
  - Sets references to token lock and staking contracts
- Events
  - ContractUpdated, TierThresholdsUpdated [governance-dao-smart-contract.sol:L324-L343](dpmc-smart-contracts/contracts/governance-dao-smart-contract.sol#L324-L343)

## Signature Scheme Overview
- Hashing: keccak256(abi.encodePacked(...)), not EIP-712
- Recovery: ECDSA.recover in STAKE and StableStaking
- Replay protection: usedSig enforced in StableStaking; signature expiry checked in both
- References:
  - STAKE recoverSigner [nft-staking-smart-contract.sol:L998-L1002](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L998-L1002)
  - StableStaking recoverSigner [stable-staking-smart-contract.sol:L818-L827](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L818-L827)

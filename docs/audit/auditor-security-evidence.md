# Security Evidence

This document summarizes concrete security measures in the codebase with direct links to source.

## ECDSA Integration
- StableStaking uses OpenZeppelin ECDSA.recover for signature safety:
  - [stable-staking-smart-contract.sol:L818-L827](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L818-L827)
- STAKE uses OpenZeppelin ECDSA.recover:
  - [nft-staking-smart-contract.sol:L1002-L1006](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1002-L1006)

## CEI Adherence
- STAKE forceStop updates state before external ERC721 transfer:
  - [nft-staking-smart-contract.sol:L1378-L1385](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1378-L1385)

## Reentrancy Protection
- ReentrancyGuard is applied to sensitive entrypoints:
  - STAKE staking: [nft-staking-smart-contract.sol:L1269-L1369](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1269-L1369)
  - STAKE unStaking: [nft-staking-smart-contract.sol:L1463-L1550](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1463-L1550)
  - STAKE forceStop: [nft-staking-smart-contract.sol:L1371-L1394](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1371-L1394)
  - StableStaking stake: [stable-staking-smart-contract.sol:L1334-L1367](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1334-L1367)
  - StableStaking requestWithdrawPrincipal: [stable-staking-smart-contract.sol:L1460-L1522](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1460-L1522)
  - StableStaking withdrawPrincipal: [stable-staking-smart-contract.sol:L1524-L1576](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1524-L1576)
  - StableStaking withdrawInterest: [stable-staking-smart-contract.sol:L1578-L1660](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1578-L1660)
- Adversarial test coverage (reentrancy during onERC721Received):
  - [ReentrancyAttacker.sol:L73-L81](dpmc-smart-contracts/contracts/mocks/ReentrancyAttacker.sol#L73-L81)

## Safe Transfers
- StableStaking enables SafeERC20:
  - using SafeERC20 for IERC20: [stable-staking-smart-contract.sol:L592](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L592)
  - safeTransferFrom in handleTransfers: [stable-staking-smart-contract.sol:L1378-L1390](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1378-L1390)
- REDEEM uses SafeERC20 for payouts and ERC721 safeTransferFrom for burns:
  - using SafeERC20: [nft-redeem-smart-contract.sol:L15-L17](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L15-L17)
  - ERC721.safeTransferFrom and ERC20.transferFrom: [nft-redeem-smart-contract.sol:L107-L110](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L107-L110)
- STAKE uses ERC721 safeTransferFrom semantics in staking/unStaking/forceStop:
  - Staking transfer: [nft-staking-smart-contract.sol:L1315-L1323](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1315-L1323)
  - ForceStop transfer: [nft-staking-smart-contract.sol:L1381-L1385](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1381-L1385)

## Failure Modes Matrix
- STAKE staking guards:
  - Signature expiry: [nft-staking-smart-contract.sol:L1279-L1281](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1279-L1281)
  - Replay prevention: [nft-staking-smart-contract.sol:L1282-L1283](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1282-L1283)
  - Valid period: [nft-staking-smart-contract.sol:L1286-L1287](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1286-L1287)
  - Address blacklist: [nft-staking-smart-contract.sol:L1290-L1294](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1290-L1294)
  - TokenId blacklist: [nft-staking-smart-contract.sol:L1295-L1299](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1295-L1299)
  - Ownership check: [nft-staking-smart-contract.sol:L1308-L1312](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1308-L1312)
  - Approval check: [nft-staking-smart-contract.sol:L1313-L1317](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1313-L1317)
  - Minimum value: [nft-staking-smart-contract.sol:L1318-L1322](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1318-L1322)
- STAKE unStaking guards:
  - Signature expiry and replay prevention: [nft-staking-smart-contract.sol:L1459-L1463](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1459-L1463)
  - Signer validation: [nft-staking-smart-contract.sol:L1469-L1477](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1469-L1477)
  - Stake ownership and timing checks: [nft-staking-smart-contract.sol:L1477-L1487](dpmc-smart-contracts/contracts/nft-staking-smart-contract.sol#L1477-L1487)
- StableStaking stake/withdraw guards:
  - Signature expiry and replay prevention (stake): [stable-staking-smart-contract.sol:L1334-L1356](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1334-L1356)
  - Signature expiry and replay prevention (withdraw principal): [stable-staking-smart-contract.sol:L1522-L1568](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1522-L1568)
  - Stake closed and not already withdrawn: [stable-staking-smart-contract.sol:L1557-L1561](dpmc-smart-contracts/contracts/stable-staking-smart-contract.sol#L1557-L1561)
- REDEEM guards:
  - Redeemability toggle and blacklists: [nft-redeem-smart-contract.sol:L96-L103](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L96-L103)
  - Ownership and approval: [nft-redeem-smart-contract.sol:L100-L105](dpmc-smart-contracts/contracts/nft-redeem-smart-contract.sol#L100-L105)

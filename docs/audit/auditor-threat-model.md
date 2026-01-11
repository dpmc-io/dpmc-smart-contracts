# Threat Model Overview

This document outlines trust assumptions, privileged operations, signer custody, and known non-goals for auditors.

## Trust Assumptions
- Admins and owners are trusted to configure parameters, addresses, and toggles correctly across contracts (staking pools, token lock, signer addresses, thresholds).
- Off-chain signer custody and signing processes are trusted to produce valid signatures and protect private keys. Contracts verify signatures but do not manage key custody.
- ERC20 and ERC721 tokens referenced are assumed to follow OpenZeppelin semantics; SafeERC20 and ERC721 safeTransferFrom are used where appropriate.
- RPC providers and wallets may perform ERC165 interface probes; contracts implement IERC721Receiver and now respond via ERC165 to prevent intermittent eth_call reverts.

## Privileged Operations
- STAKE (NFT Staking)
  - Admin-only parameter updates: max pool, blacklists, signer address, forced unstake days, min stake, re-staking limit [nft-staking-smart-contract.sol:L1012-L1060]
  - Pause/unpause: [nft-staking-smart-contract.sol:L960-L965]
  - ForceStop (admin): [nft-staking-smart-contract.sol:L1329-L1358]
- StableStaking (ERC20 Staking)
  - Admin-only updates: thresholds, stakes caps, interest per tier, token addresses, pools, lock mode [stable-staking-smart-contract.sol:L847-L901], [stable-staking-smart-contract.sol:L860-L901]
  - Pause/unpause: [stable-staking-smart-contract.sol:L41-L47 of tests]
  - ForceStop (admin): [stable-staking-smart-contract.sol:L1410-L1451]
- REDEEM (NFT Redeem)
  - Admin-only toggles and blacklists; owner updates of contract addresses [nft-redeem-smart-contract.sol:L56-L94]
- DPToken (ERC20)
  - Only owner can authorize staking contracts via setStakingContract; staking contracts update locked balances via onlyStakingContract [dp-token-smart-contract.sol:L839-L899]
- GovernanceDAO
  - Owner adds/removes admins; admins update token lock and staking contract references; admins set tier thresholds [governance-dao-smart-contract.sol:L344-L404]

## Signer Custody & Validation
- STAKE
  - Signing scheme: keccak256(abi.encodePacked(...)); signer address managed via updateSignerAddress; validation via ECDSA.recover [nft-staking-smart-contract.sol:L1298-L1307], [nft-staking-smart-contract.sol:L1469-L1477]
- StableStaking
  - Signing scheme includes address(this) and msg.sender, with usedSig replay protection; validation via ECDSA.recover [stable-staking-smart-contract.sol:L1339-L1356], [stable-staking-smart-contract.sol:L1528-L1568]
- Custody is off-chain; contracts provide verification and expiry checks but no on-chain key management.

## Known Non-Goals
- No EIP-712 typed data signatures; digest formation uses abi.encodePacked for simplicity and gas efficiency.
- No on-chain oracle integration for token pricing beyond INFE721.tokenValue and provided tokenRateUSDT inputs.
- No automatic slashing or punitive economics beyond configured penalty percentages and forced unstake windows in STAKE.
- No upgradeable proxy patterns enforced in contracts; deployments may choose proxies, but contracts are written as non-upgradeable by default.
- No on-chain role delegation beyond owner/admin patterns; multi-sig or timelock governance is external to these contracts.

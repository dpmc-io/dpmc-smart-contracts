# Defistation Project by DPMC

Defistation is a decentralized finance (DeFi) ecosystem by DPMC designed to make staking, rewards, and governance transparent, auditable, and user-friendly. This repository hosts the smart contracts and tooling that power token staking, NFT-based staking, reward redemption, and DAO governance on Arbitrum networks.

## Project Description
Defistation provides two complementary staking systems—an ERC20-based stable staking module and an ERC721 (NFT) staking module—along with a governance DAO and supporting contracts for rewards and certificates. Users can stake tokens, accrue interest, claim rewards, and participate in governance proposals under well-defined rules enforced on-chain.

## Purposes
- Enable users to stake tokens and earn predictable rewards with tiered benefits
- Provide institutional and personal staking flows with tailored guard rails
- Make reward redemption traceable via NFTs and on-chain events
- Allow governance participation using tier points and structured proposals
- Offer operability on Arbitrum networks with low fees and fast finality

## Core Functionality
- ERC20 Stable Staking:
  - Stake a stable-denominated amount for fixed periods (e.g., 6/18 months)
  - Tiered additional interest (Bronze, Silver, Gold, VIP)
  - Optional lock mode requiring a minimum of locked tokens to access higher tiers
  - Withdraw principal (subject to rules) and periodic interest with signature validation
- NFT Staking:
  - Stake certificate NFTs with APR schedules and penalty logic
  - Restricted re-staking rules, blacklist support, and admin force-stop
  - Gas-efficient reward calculations and period management
- Governance DAO:
  - Submit proposals, vote using tier points, and finalize outcomes
  - Lightweight on-chain process with clear events and role protections
- Certificates and Rewards:
  - ERC721 certificate contract with transfer restrictions and allowlists
  - Reward redemption with controlled pool addresses and admin validation

## Benefits
- Transparency: Every key action emits events, enabling analytics and audits
- Security: Admin roles, pausable modules, signature verification, and input guard rails
- Flexibility: Tier configuration, staking periods, interest rates, and pool addresses are adjustable by admins
- Composability: ERC20 and ERC721 staking modules can operate independently or together
- Performance: Deployed on Arbitrum for lower gas fees and fast confirmations

## Features
- Tier System:
  - Bronze, Silver, Gold, VIP tiers determined by locked token thresholds
  - Additional interest per tier in parts-per-million (PPM) to ensure precision
  - Personal vs. Institutional user flows with appropriate minimums and caps
- Period Management:
  - Enable/disable staking periods dynamically with APR changes and limiter bounds
  - Monthly interest model with strict validation against configured limiter months
- Signature-Based Actions:
  - Stake and withdraw interest gated by signatures from the authorized signer wallet
  - Replay protection and expiry guards for safety and predictability
- Administrative Controls:
  - Pause/unpause contracts during maintenance or incidents
  - Update pools, thresholds, min stakes, and token references safely
  - Blacklist/allowlist features for NFT staking and certificates

## Technology
- Languages & Frameworks:
  - Solidity 0.8.20 (optimizer, viaIR enabled)
  - Hardhat for compilation, testing, coverage, gas reporting, and Etherscan verification
- Libraries:
  - OpenZeppelin Contracts for ERC20, ERC721, security patterns, and utilities
- Tooling:
  - ESLint, Prettier, Solhint for static checks and formatting
  - solidity-coverage for test coverage
  - hardhat-gas-reporter for gas analysis
- Networks:
  - Arbitrum One (mainnet) and Arbitrum Sepolia (testnet)

## Contracts Overview
- DPToken (ERC20):
  - Core payment and staking token with whitelist/blacklist controls and pause/unpause
  - Tracks staking contract authorization for secure transfers
- CERTIFICATE (ERC721):
  - Certificates for minting and transfer restrictions with allowlists
  - Integrates with reward redemption logic
- REDEEM:
  - Handles redemption flows with configured payout and token references
  - Emits events for transparent reward distribution
- STAKE (NFT Staking):
  - Stakes certificate NFTs, validates APR periods and penalties
  - Enforces restricted re-staking limits, blacklist behaviors, and admin interventions
- StableStaking (ERC20 Staking):
  - Personal and Institutional modes with distinct minimums and tier rules
  - Lock mode, tier thresholds, additional interest in PPM, and monthly interest logic
  - Signature-gated stake and interest withdrawal with limiter months
- GovernanceDAO:
  - Proposal creation, tier point-based voting, and finalization mechanics
  - Admin role protections and event emissions for each action

## Defistation Architecture Overview
- Core modules:
  - StableStaking (ERC20) for fixed-period staking with tiered additional interest
  - STAKE (NFT) for certificate-based staking with APR schedules and penalties
  - CERTIFICATE (ERC721) for issuance and transfer restrictions related to redemption
  - REDEEM for reward redemption, referencing configured payout and token addresses
  - GovernanceDAO for admin management, tier configuration, and governance processes
- Supporting contracts and references:
  - DPToken (ERC20) used for payments, staking authorization, and whitelist/blacklist controls
  - Token lock integration enabling “lock mode” for tier access based on minimum locked amounts
  - Pools: staking, reward, payment, and locking pools are configurable by admins
- Off-chain signer and validation:
  - Authorized signer produces signatures gating stake and interest withdrawals
  - Contracts validate signatures, enforce expiry, and protect against replay
- Events and state:
  - All critical flows emit events for auditability (stake, withdraw, admin updates)
  - Read-only views expose tier info, periods, and user stake state for Dapp integrations

## Token Economics
- Tiers and thresholds:
  - Bronze, Silver, Gold, VIP tiers based on locked balance thresholds
  - Lock mode optionally required to access higher tiers when enabled
- Interest model:
  - Additional interest per tier expressed in PPM for precision
  - Monthly interest withdrawals validated against configured limiter months
  - Personal and Institutional flows apply distinct minimums and caps
- NFT APR and penalties:
  - APR schedules per period for certificate staking
  - Penalty parameters apply to certain unstake scenarios under defined rules
- Governance influence:
  - Admins can adjust thresholds, periods, and interest parameters via governed processes
  - Events document each change for transparent audits and monitoring

## Deployment Networks
- Arbitrum One (Mainnet):
  - Target network for production deployments with low fees and fast finality
  - Contracts verified post-deploy; wiring includes pools, token references, and signer
- Arbitrum Sepolia (Testnet):
  - Pre-production testing and validation environment mirroring mainnet configuration
  - Supports sequence deployments and verification with the same scripts
  
For scripted deploy/verify flows and per-network details, see:
- Deploy scripts under `scripts/`
- Sequenced deploy/verify and records under `deployments/<network>.json`

## Developer & QA Tooling
- Sequenced Deploy/Verify:
  - Per-network deployment history under `deployments/<network>.json`
  - Sequenced deployment script wires all references and saves a single record with constructor args
  - Verification script uses the latest record to verify all contracts with their parameters
- Environment Validation:
  - Pre-flight validation of required env variables before any deploy script runs
  - Modes for “sequence” (full variable set) and “basic” (common + network)
- Tests:
  - Branch coverage tests for staking modules, certificate, and governance
  - Property/fuzz-style tests for expiry validation, arrays permutations, and tier boundaries under lockMode
  - Deterministic time helpers to reduce flakiness
  - Gas snapshot tests to monitor upper bounds and detect regressions

## Getting Started (Public Users)
- Interact through the Dapp or supported wallets; staking actions typically require:
  - Approving the staking contract to spend your tokens (ERC20) or NFTs (ERC721)
  - Obtaining a valid signature from the authorized signer (surfaced via the Dapp)
  - Choosing a staking period and confirming the transaction with your wallet
- Check your tier information and staking periods through read-only views in the Dapp; on-chain events and data can be inspected via block explorers.

## Notes & Disclaimers
- Always verify the network and contract addresses in the Dapp before signing or sending transactions.
- Rewards, APRs, and thresholds are subject to change by authorized admins through governed processes; consult official announcements for the latest parameters.
- This repository contains smart contracts and developer tooling; end users should rely on the official Dapp or trusted interfaces for day-to-day operations.

# STAKE (NFT Staking) Contract Documentation

## Overview
- Accepts staking of CERTIFICATE ERC721 tokens to earn ERC20 rewards.
- Enforces configurable APR/Penalty, min stake value, pool cap, and anti re-staking controls.
- Gated by off-chain signatures for staking and unstaking flows.
- Uses CEI pattern and nonReentrant guards for sensitive operations.

## Storage
- MIN_TOKEN_TO_STAKE: min NFT tokenValue required to stake
- PPM: 1,000,000 basis for percentage calculations
- FORCED_UNSTAKE_IN_DAYS: forced-unstake window configuration (minutes in current build)
- RESTRICTED_RE_STAKING: limit for re-staking attempts (0 = unlimited)
- SIGNER: authorized signer address
- erc721token: CERTIFICATE contract
- erc20token: reward token
- REWARD: reward pool address
- DEFAULT_PERCENTAGE_USED: toggle to use stored stake percentages vs current APR/PENALTY tables
- totalStakingPool, maxStakingPool: tracked and capped pool values
- stakes[id] => Stake: staked NFT and accounting
- APR[13], PENALTY[13]: per-period configuration tables
- usedSig[bytes]: signature replay protection
- STAKING_REWARD[stakeId]: per-stake reward cache (unused in current build)
- isAddressBlacklisted[address], isAdmin[address]
- isTokenIdBlacklisted[erc721][tokenId]
- restrictedReStakingCounter[erc721][tokenId]: re-staking counter
- ESTIMATED_BRV: placeholder for BRV estimation cache
- receivedERC721[from][tokenId] => ERC721Received: last received metadata

## Events
- MaxStakingPoolUpdated(previousValue, newValue)
- AdminUpdated(admin, isAdmin)
- BlacklistedAddressUpdated(user, isBlacklisted)
- BlacklistedTokenIdUpdated(stakedToken, tokenId, isBlacklisted)
- ForcedUnstakeInDaysUpdated(unstakeDays)
- MinNFEUpdated(minNFE)
- RestrictedReStakingUpdated(restrictN)
- SignerAddressUpdated(signerAddress)
- NFEAddressUpdated(nfeAddress)
- DPMCAddressUpdated(dpmcAddress)
- RewardAddressUpdated(rewardAddress)
- PercentageUsedUpdated(isPercentageUsed)
- AprPercentageUpdated(stakePeriod, previousValue, newValue)
- PenaltyPercentageUpdated(stakePeriod, penaltyValue)
- Staking(stakeId, tokenId, tokenValue, period, apr, penalty, startedPrice, startedAt, endedAt, forcedUnstakeAt, brvLow, brvHigh)
- UnStaking(stakeId, tokenId, endedPrice, reward, finalApr, finalPenalty, timeStamp)
- ForceStop(stakeId, tokenId, staker, admin, timeStamp)

## Modifiers
- onlyAdmin: admin or owner
- whenNotPaused / whenPaused: internal Pausable

## Structs
- Stake: core per-stake record
- ERC721Received: captures onERC721Received arguments

## Constructor
### constructor()
- Increments nextStakingId and sets default parameters:
  - MIN_TOKEN_TO_STAKE = 100 DPMC (18 decimals)
  - PPM = 1,000,000
  - RESTRICTED_RE_STAKING = 0 (unlimited)
  - Set default contract addresses for NFT, ERC20, REWARD, SIGNER
  - DEFAULT_PERCENTAGE_USED = true
  - FORCED_UNSTAKE_IN_DAYS = 30 (minutes variant in code)
  - APR[3/6/9/12] = 150,000 (15.00% PPM)
  - PENALTY[3/6/9/12] = 100,000 (10.00% PPM)
  - maxStakingPool = 0 (unlimited)

## Pause Control
### pause() external onlyAdmin
### unpause() external onlyAdmin
- Uses internal Pausable to toggle paused state.

## ERC721 Receiver
### onERC721Received(address operator, address from, uint256 tokenId, bytes data) public override returns (bytes4)
- Records received metadata for auditability; returns selector.

## Signature Utilities
### splitSignature(bytes sig) internal pure returns (uint8, bytes32, bytes32)
### recoverSigner(bytes32 _hashedMessage, bytes sig) internal pure returns (address)
- Parses signatures and recovers signers via ECDSA.recover.

## Administration
### addOrRemoveAdmin(address _admin, bool _true) public onlyOwner
- Manages admin set.

### updateMaxStakingPool(uint256 newMaxStakingPool) external onlyAdmin
- Caps totalStakingPool; 0 means unlimited.

### updateBlacklistedAddress(address _user, bool _isBlacklisted) public onlyAdmin
### updateBlacklistedTokenId(uint256 tokenId, bool _isBlacklisted) public onlyAdmin
- Manages blacklists for users and specific NFTs.

### updateForceUnstakeInDays(uint16 _days) public onlyAdmin
- Updates forced-unstake configuration (minutes variant in current build).

### updateMinStake(uint256 _mintStake) public onlyAdmin
- Sets MIN_TOKEN_TO_STAKE.

### updateRestrictedReStaking(uint16 _restrictN) public onlyAdmin
- Sets max re-staking count per token (0 = unlimited).

### updateSignerAddress(address _signerAddress) public onlyAdmin
### updateNFEaddress(address _nfeAddress) public onlyAdmin
### updateDPMCaddress(address _dpmcAddress) public onlyAdmin
### updateRewardAddress(address _rewardAddress) public onlyAdmin
- Updates integration addresses; emits corresponding events.

### updatePercentageUsed(bool _true) public onlyAdmin
- Enables using stored percentages on stake vs current APR/PENALTY tables at unstake time.

### updateAprPercentage(uint8 _stakePeriod, uint256 _aprValue) public onlyAdmin
- Requires _aprValue ≥ 10,000 (≥1% PPM).
- Updates APR table at index stakePeriod.

### updatePenaltyPercentage(uint8 _stakePeriod, uint256 _penaltyValue) public onlyAdmin
- Requires _penaltyValue < PPM and between [10,000, PPM]; sets PENALTY for period.

## Helpers and Math
### isRestricted(uint counter) public view returns (bool)
- True if RESTRICTED_RE_STAKING > 0 and counter ≥ RESTRICTED_RE_STAKING.

### calculatePenaltyValue(uint256 _aprValue, uint8 _stakePeriod, uint256 _penaltyPercentage) public view returns (uint256)
- Computes reduced APR based on penalty percentage.

### calculatePenaltyBRV(uint256 _usdtValue, uint256 _penaltyPercentage) public view returns (uint256)
- Penalty-based reward value in USDT.

### GPV(uint256 _tokenRateUSDT, uint256 _tokenValue) public pure returns (uint256)
- Global parameter value: tokenRateUSDT * tokenValue adjusted for 18 decimals.

### AMP(uint256 _aprPercentage) public pure returns (uint256)
- APR monthly percentage factor.

### SPP(uint256 _amp, uint256 _stakePeriod) public pure returns (uint256)
- Stake period percentage.

### BRV(uint256 _gpv, uint256 _spp) public pure returns (uint256)
- Based reward value.

### calculateBasedRewardValue(uint256 _apr, uint256 _tokenRateUSDT, uint256 _tokenValue, uint256 _stakePeriod) public pure returns (uint256)
- Full reward calculation pipeline to BRV.

### convertUsdtToToken(uint256 usdtAmount, uint256 tokenRateUSDT) public pure returns (uint256)
- Converts USDT value to ERC20 token amount (18 decimals).

### getCertPriceInUsdt(uint256 tokenPrice, uint256 tokenAmount) public pure returns (uint256)
- Computes USDT value for a tokenAmount at tokenPrice.

### periodList() public view returns (uint256[] memory)
- Returns stake periods with APR configured (>0).

### periodInUnixTimestamp(uint256 _stakePeriod) public view returns (uint256)
- Returns end timestamp by adding minutes (current build) to now.

### forcedUnstakePeriodInUnixTimestamp(uint256 _stakeEndedAt) public pure returns (uint256)
- Returns forced-unstake timestamp (minutes variant).

### calculatePercentage(uint256 value, uint256 basisPoints) public view returns (uint256)
- Generic PPM percentage calculation.

### _calculateRewards(uint256 certUsdtValue, uint8 stakePeriod, uint256 tokenRateUSDT, uint256 tokenValue) internal view returns (uint256 stakingRewardLow, uint256 stakingRewardHigh)
- Computes low/high token rewards by converting BRV results from USDT to ERC20 tokens.

## Staking Flow
### staking(uint256 tokenId, uint8 stakePeriod, uint256 tokenRateUSDT, uint256 exp, bytes sig) public whenNotPaused nonReentrant returns (uint256 tokenValue)
- Preconditions:
  - maxStakingPool == 0 or totalStakingPool + tokenValue ≤ maxStakingPool
  - signature not expired and not reused
  - APR[stakePeriod] > 0
  - user and tokenId not blacklisted; re-staking within allowed limits
  - recoverSigner(keccak256(abi.encodePacked(msg.sender, tokenId, stakePeriod, tokenRateUSDT, exp))) == SIGNER
  - user owns tokenId and has set isApprovedForAll
  - tokenValue ≥ MIN_TOKEN_TO_STAKE
- Actions:
  - Transfers NFT to contract
  - Calculates rewards range
  - createStake(...) to persist record
  - Increments restrictedReStakingCounter
  - Increases totalStakingPool and nextStakingId
  - emitStakingEvent(...)

### forceStop(uint256 stakeId) external onlyAdmin nonReentrant
- CEI:
  - Reads tokenValue from NFT contract
  - Marks stake.endedPrice = 1 and reduces totalStakingPool
  - Transfers NFT back to staker
  - Emits ForceStop

### unStaking(uint256 stakeId, uint256 tokenRateUSDT, uint256 exp, bytes sig) public nonReentrant
- Preconditions:
  - valid signature and not reused
  - stake not previously ended; sender is staker; now ≥ forcedUnstakeAt
- Computes reward:
  - If forced-unstaked (before endedAt), applies penalty flow
  - Else computes BRV-based reward
- Requires REWARD balance and allowance to cover reward
- Transfers NFT back and ERC20 reward to staker
- Sets endedPrice = tokenRateUSDT and reduces totalStakingPool
- Emits UnStaking

## Internal Stake Persistence
### getTokenValue(uint256 tokenId) internal view returns (uint256)
- Reads tokenValue from NFT.

### createStake(uint256 stakeId, uint256 tokenId, uint8 stakePeriod, uint256 tokenRateUSDT, uint256 certUsdtValue, uint256 tokenValue) internal
- Initializes Stake struct with key fields and timestamps.

### calculateEstimatedBRV(...) internal
- Placeholder; estimation loop removed.

### emitStakingEvent(uint256 stakeId, uint256 tokenId, uint256 tokenValue, uint8 stakePeriod, uint256 tokenRateUSDT, uint256 brvLow, uint256 brvHigh) internal
- Emits Staking with computed parameters and window timestamps.

## ERC165
### supportsInterface(bytes4 interfaceId) public view override returns (bool)
- Supports IERC721Receiver and inherited interfaces.

## Function Details
- pause(), unpause()
  - Purpose: Toggle paused state for staking operations.
  - Access: onlyAdmin.
- Source: [nft-staking-smart-contract.sol:L960-L965](contracts/nft-staking-smart-contract.sol#L960-L965)
- onERC721Received(address operator, address from, uint256 tokenId, bytes data)
  - Purpose: Accept ERC721 tokens and capture receipt metadata.
  - Access: public override.
- Source: [nft-staking-smart-contract.sol:L968-L982](contracts/nft-staking-smart-contract.sol#L968-L982)
- splitSignature(bytes sig), recoverSigner(bytes32 _hashedMessage, bytes sig)
  - Purpose: Signature parsing and signer recovery for gated actions.
  - Access: internal pure.
- Source: [nft-staking-smart-contract.sol:L983-L1006](contracts/nft-staking-smart-contract.sol#L983-L1006)
- addOrRemoveAdmin(address _admin, bool _true)
  - Purpose: Manage admin set.
  - Access: onlyOwner.
  - Emits: AdminUpdated.
- Source: [nft-staking-smart-contract.sol:L1017-L1021](contracts/nft-staking-smart-contract.sol#L1017-L1021)
- updateMaxStakingPool(uint256 newMaxStakingPool)
  - Purpose: Cap total staking pool; 0 = unlimited.
  - Access: onlyAdmin.
  - Emits: MaxStakingPoolUpdated.
- Source: [nft-staking-smart-contract.sol:L1022-L1029](contracts/nft-staking-smart-contract.sol#L1022-L1029)
- updateBlacklistedAddress(address _user, bool _isBlacklisted)
  - Purpose: Manage user blacklist.
  - Access: onlyAdmin.
  - Emits: BlacklistedAddressUpdated.
- Source: [nft-staking-smart-contract.sol:L1030-L1037](contracts/nft-staking-smart-contract.sol#L1030-L1037)
- updateBlacklistedTokenId(uint256 tokenId, bool _isBlacklisted)
  - Purpose: Manage NFT tokenId blacklist.
  - Access: onlyAdmin.
  - Emits: BlacklistedTokenIdUpdated.
- Source: [nft-staking-smart-contract.sol:L1038-L1045](contracts/nft-staking-smart-contract.sol#L1038-L1045)
- updateForceUnstakeInDays(uint16 _days), updateMinStake(uint256 _mintStake), updateRestrictedReStaking(uint16 _restrictN)
  - Purpose: Configure forced-unstake window, minimum stake, and re-staking limits.
  - Access: onlyAdmin.
  - Emits: ForcedUnstakeInDaysUpdated / MinNFEUpdated / RestrictedReStakingUpdated.
- Source: [nft-staking-smart-contract.sol:L1046-L1060](contracts/nft-staking-smart-contract.sol#L1046-L1060)
- updateSignerAddress(address _signerAddress), updateNFEaddress(address _nfeAddress), updateDPMCaddress(address _dpmcAddress), updateRewardAddress(address _rewardAddress)
  - Purpose: Update integration addresses.
  - Access: onlyAdmin.
  - Emits: SignerAddressUpdated / NFEAddressUpdated / DPMCAddressUpdated / RewardAddressUpdated.
- Source: [nft-staking-smart-contract.sol:L1061-L1080](contracts/nft-staking-smart-contract.sol#L1061-L1080)
- updatePercentageUsed(bool _true), updateAprPercentage(uint8 _stakePeriod, uint256 _aprValue), updatePenaltyPercentage(uint8 _stakePeriod, uint256 _penaltyValue)
  - Purpose: Configure percentage usage and APR/PENALTY tables.
  - Access: onlyAdmin.
  - Emits: PercentageUsedUpdated / AprPercentageUpdated / PenaltyPercentageUpdated.
- Source: [nft-staking-smart-contract.sol:L1081-L1115](contracts/nft-staking-smart-contract.sol#L1081-L1115)
- isRestricted(uint counter)
  - Purpose: Check re-staking restriction status.
  - Access: public view.
- Source: [nft-staking-smart-contract.sol:L1116-L1119](contracts/nft-staking-smart-contract.sol#L1116-L1119)
- Math helpers (calculatePenaltyValue, calculatePenaltyBRV, GPV, AMP, SPP, BRV, calculateBasedRewardValue, convertUsdtToToken, getCertPriceInUsdt)
  - Purpose: Support reward and penalty computations using PPM math.
  - Access: public pure/view.
- Source: [nft-staking-smart-contract.sol:L1120-L1188](contracts/nft-staking-smart-contract.sol#L1120-L1188)
- periodList(), periodInUnixTimestamp(uint256 _stakePeriod), forcedUnstakePeriodInUnixTimestamp(uint256 _stakeEndedAt)
  - Purpose: Period selection and timestamp calculations.
  - Access: public view/pure.
- Source: [nft-staking-smart-contract.sol:L1195-L1226](contracts/nft-staking-smart-contract.sol#L1195-L1226)
- calculatePercentage(uint256 value, uint256 basisPoints)
  - Purpose: PPM percentage calculation utility.
  - Access: public view.
- Source: [nft-staking-smart-contract.sol:L1237-L1244](contracts/nft-staking-smart-contract.sol#L1237-L1244)
- _calculateRewards(...)
  - Purpose: Compute low/high rewards from USDT BRV conversion.
  - Access: internal view.
- Source: [nft-staking-smart-contract.sol:L1245-L1268](contracts/nft-staking-smart-contract.sol#L1245-L1268)
- staking(uint256 tokenId, uint8 stakePeriod, uint256 tokenRateUSDT, uint256 exp, bytes sig)
  - Purpose: Stake NFT into the pool with signature validation.
  - Access: public whenNotPaused nonReentrant.
  - Emits: Staking.
  - Requirements: pool cap, signature, APR period, blacklist checks, ownership, approval, min value.
- Source: [nft-staking-smart-contract.sol:L1269-L1369](contracts/nft-staking-smart-contract.sol#L1269-L1369)
- forceStop(uint256 stakeId)
  - Purpose: Admin stops a stake early and returns NFT.
  - Access: external onlyAdmin nonReentrant.
  - Emits: ForceStop.
  - CEI: mark ended, update pool, transfer NFT, emit.
- Source: [nft-staking-smart-contract.sol:L1371-L1394](contracts/nft-staking-smart-contract.sol#L1371-L1394)
- getTokenValue(uint256 tokenId)
  - Purpose: Read tokenValue from NFT contract.
  - Access: internal view.
- Source: [nft-staking-smart-contract.sol:L1396-L1400](contracts/nft-staking-smart-contract.sol#L1396-L1400)
- createStake(...)
  - Purpose: Persist Stake struct fields.
  - Access: internal.
- Source: [nft-staking-smart-contract.sol:L1401-L1424](contracts/nft-staking-smart-contract.sol#L1401-L1424)
- emitStakingEvent(...)
  - Purpose: Emit Staking with computed and window parameters.
  - Access: internal.
- Source: [nft-staking-smart-contract.sol:L1463-L1446](contracts/nft-staking-smart-contract.sol#L1425-L1446)
- unStaking(uint256 stakeId, uint256 tokenRateUSDT, uint256 exp, bytes sig)
  - Purpose: Unstake with signature validation and reward computation.
  - Access: public nonReentrant.
  - Emits: UnStaking.
- Source: [nft-staking-smart-contract.sol:L1463-L1550](contracts/nft-staking-smart-contract.sol#L1463-L1550)

# StableStaking Contract Documentation

## Overview
- ERC20-based staking system with tiered additional interest and optional token lock mode.
- Supports personal and institutional users, per-period APRs, bonding/withdrawal periods, and session-based interest withdrawals.
- Integrates with a token-locking contract to reflect and update locked balances used for tier calculation.

## External Contracts
- IERC20 stakingToken: token staked and paid for interest/principal
- IERC20 lockingToken: token being optionally locked to elevate tier
- ITokenLock tokenLock: exposes updateLockedAmount() and tokenLocked()
- Uses SafeERC20 for safe transfers; ECDSA for signature validation

## Enums
- Tier: NoTier, Bronze, Silver, Gold, VIP
- UserType: Personal, Institutional

## Core Data Structures
- UserInfo: {userType, totalStaked, totalLocked, stakeCount}
- UserStakeInfo: summary view for UI (available balances, eligible interest, allocations, tier, lockMode)
- StakingPeriod: {period, interestRate, totalActiveStaking, totalActiveStakeAmount, totalLockedAmount, limiter, exists}
- TierInfo: view of thresholds and per-tier stakes/interest
- StakeParams: internal composition for stake execution (inputs and computed outputs)
- StakeAmounts: {stakedAmount, lockedAmount}
- StakeMeta: staking lifecycle metadata including timestamps and interest parameters
- StakeInfo: {amounts, meta}
- TokenLockedInfo: current locking context for a user (stakeId, lockedAmount)
- PoolMetrics: aggregate metrics (total staked, locked, active staked, withdrawn, distributed interest)
- WithdrawalInterest: amount and timestamp per stakeId per month
- WithdrawnAddress: per-user withdrawal state and history

## Storage
- stakingToken, lockingToken, tokenLock
- stakingPeriod[]: list of period keys
- bondingPeriod: min days holding before certain actions (configurable)
- withdrawalPeriod: days before interest withdrawal allowed (configurable)
- personalMinStake, institutionalMinStake: minimum stake amounts
- totalMaxStakingPool: global cap on total staked amount
- totalStakedAmount, totalLockedAmount, totalActiveStaked, totalRewardDistribution
- currentStakeId: incremental stake id
- maxStakeAttempts: per-user concurrent stake count cap
- tierCategories[]: names for public display
- MIN_*_THRESHOLD: per-tier token lock thresholds
- stakingPoolAndReward, lockingPool: destination pools for transfers
- signer: signature authority
- lockMode: global requirement for locking when true
- poolMetrics: aggregate counters
- isAdmin[address]
- withdrawn[address] => WithdrawnAddress
- maxStakeForTier[Tier] => max stake limits
- additionalInterestForTier[Tier] => per-tier additional interest (PPM)
- stakingPeriods[period] => StakingPeriod
- users[address] => UserInfo
- usedSig[bytes] => replay protection
- stakes[address][stakeId] => StakeInfo
- tokenLocked[address] => TokenLockedInfo

## Events
- AdminUpdated(address admin, bool isAdmin)
- WithdrawPrincipalRequested(address staker, uint256 stakeId, uint256 requestedAt, bool isRequested)
- ForceStop(address staker, uint256 stakeId, uint256 requestedAt, bool isRequested)
- Withdrawn(address user, uint256 amount)
- StakingPeriodEvent(periodDuration, periodApr, limiter, exist, method)
- AdditionalInterestUpdated(Tier tier, uint256 newInterestPPM)
- MaxStakeUpdated(Tier tier, uint256 newMaxStake)
- BondingPeriodUpdated(uint256 newBondingPeriod)
- WithdrawalPeriodUpdated(uint256 newWithdrawalPeriod)
- PersonalMinStakeUpdated(uint256 newMinStake)
- InstitutionalMinStakeUpdated(uint256 newMinStake)
- totalMaxStakingPoolUpdated(uint256 newMaxstakingPoolAndReward)
- stakingPoolAndRewardUpdated(address newstakingPoolAndReward)
- lockedTokenUpdated(address newlockedToken)
- LockModeUpdated(bool oldValue, bool newValue)
- StakingTokenUpdated(address oldAddress, address newAddress)
- LockingTokenUpdated(address oldAddress, address newAddress)
- ThresholdUpdated(Tier tier, uint256 newThreshold)
- ContractStateChanged(string action, address account)
- WithdrawnPrincipal(address user, uint256 stakeId, uint256 stakedAmount, uint256 lockedAmount, uint256 timeStamp)
- InterestWithdrawn(address user, uint256 stakeId, uint256[] months, uint256 totalAmount, uint256 timeStamp)
- Staked(wallet, stakeId, stakedAmount, period, tokenLocked, baseInterest, additionalInterest, stakingDate, stakingEndDate, monthlyInterest, periodLimit, tier)

## Modifiers
- onlyAdmin: admin or owner
- onlyValidAddress(address): nonzero address check

## Constructor
### constructor(address _stakingToken, address _stakingPoolAndReward, address _lockingToken, address _lockingPool, address _signer)
- Validates addresses and initializes references.
- Sets default additionalInterestForTier and maxStakeForTier per tier.
- Adds default staking periods via addStakingPeriod(period, aprPPM, limiter).
- lockMode defaults to false.

## Admin and Pausable
### addOrRemoveAdmin(address _admin, bool _true) public onlyOwner
- Manages admin set.

### pause() public onlyAdmin
### unpause() public onlyAdmin
- Toggles global pause and emits ContractStateChanged.

### updateLockMode(bool _status) public onlyAdmin
- Requires _status != current; emits LockModeUpdated and sets lockMode.

## Locking Integration
### getLockedAmount(address account) internal view returns (uint256)
- Reads tokenLock.tokenLocked(account) if tokenLock set.

### updateUserLockedAmount(address account, uint256 amount, bool increase) internal
- Calls tokenLock.updateLockedAmount(account, amount, increase) if available.

## Signature Utility
### recoverSigner(bytes32 _hashedMessage, bytes sig) internal pure returns (address)
- ECDSA.recover to validate signed payloads.

## Thresholds and Contract Updates
### updateThreshold(Tier tier, uint256 value) public onlyAdmin
- Updates per-tier minimum locked thresholds; emits ThresholdUpdated.

### updateStakingPoolAndReward(address _newAddress) external onlyValidAddress onlyAdmin
### updateLockingPool(address _newAddress) external onlyValidAddress onlyAdmin
- Updates pools and emits corresponding events.

### updateBondingPeriod(uint256 _newBondingPeriod) external onlyAdmin
### updateWithdrawalPeriod(uint256 _newWithdrawalPeriod) external onlyAdmin
- Updates bonding/withdrawal periods; emits events.

### updatePersonalMinStake(uint256 _newMinStake) external onlyAdmin
### updateInstitutionalMinStake(uint256 _newMinStake) external onlyAdmin
- Sets min stake amounts; emits events.

### updateTotalMaxStakingPool(uint256 _newMax) external onlyAdmin
- Sets global staking cap; emits totalMaxStakingPoolUpdated.

### updateMaxStakeForTier(Tier _tier, uint256 _newMaxStake) external onlyAdmin
- Sets per-tier max stake limit; emits MaxStakeUpdated.

### updateAdditionalInterestForTier(Tier _tier, uint256 _newInterestPPM) external onlyAdmin
- Sets per-tier additional interest in PPM [1%..100%]; emits AdditionalInterestUpdated.

### updateStakingToken(address _newAddress) external onlyAdmin
### updateLockingToken(address _newAddress) external onlyAdmin
- Updates token addresses and tokenLock reference for lockingToken; emits corresponding events.

## Tier Utilities
### getUserTier(uint256 _lockedAmount) public view returns (Tier)
- Returns tier by comparing _lockedAmount to thresholds.

### getGlobalUserTier(address account, UserType userType) public view returns (Tier)
- Sums tokenLock.tokenLocked(account) + lockingToken.balanceOf(account).
- Applies special handling for personal accounts at VIP threshold.

### getTierName(Tier tier) internal pure returns (string)
- Returns human-readable tier name.

### getAllTiers() public view returns (TierInfo[5] memory)
- Returns overview of all tiers, including thresholds and stake limits.

## Interest Calculations
### calculateStakingInterest(uint256 totalDays, uint256 totalDaysInMonth, uint256 totalStakingAmount, uint256 interestRate) public pure returns (uint256)
- Computes pro-rated monthly interest.

### calculateMonthlyStakingInterest(uint256 stakedAmount, uint256 interestRate) internal pure returns (uint256)
- Annual interest (PPM) divided by 12.

## Staking Period Management
### addStakingPeriod(uint256 _period, uint256 _interestRate, uint256 _limiter) public onlyAdmin
- Adds a new staking period with APR in PPM; limiter ≥ period.

### updateStakingPeriod(uint256 _period, uint256 _interestRate, uint256 _limiter) public onlyAdmin
- Updates interest rate for existing period.

### disableStakingPeriod(uint256 _period) public
### enableStakingPeriod(uint256 _period, uint256 _interestRate) public
- Disables/enables a period; enabling sets a new interest rate.

### periodList() public view returns (uint256[] _period, uint256[] _interestRate, uint256[] _totalActiveStaking, uint256[] _totalActiveStakeAmount, uint256[] _totalLockedAmount, bool[] _isActive)
- Returns arrays of period configuration and counters.

## Staking Execution
### stake(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked, uint256 exp, bytes sig) external whenNotPaused nonReentrant
- Signature payload: address(this), msg.sender, _userType, _period, _stakedAmount, _isTokenLocked, exp.
- Requires signature valid and unused, then calls executeStaking(...).

### executeStaking(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked, uint256 exp, bytes sig) internal
- Validates conditions:
  - period exists, totalMaxStakingPool not exceeded
  - stake attempts ≤ maxStakeAttempts
  - enforces per-user min stake and max tier stake
  - lockMode requires _isTokenLocked and sufficient locked amount
- Computes StakeParams including staking end date and monthly interest.
- Updates user locked amounts, transfers staked and locked tokens to pools.
- Creates StakeInfo, updates metrics and per-period counters.
- Emits Staked event.

### createStakeInfo(address user, StakeParams params) internal returns (uint256)
- Allocates a new stake id and sets StakeInfo with amounts/meta.
- Updates global and per-user metrics and period counters.
- Returns the new stake id.

### updateTokenLockedInfo(address user, StakeParams params) internal
- Updates tokenLocked[user] with most distant staking end date and totalLocked amount.

## Forced Stop and Withdrawals
### forceStop(uint256 _stakeId, address _staker) external onlyAdmin nonReentrant
- Marks stake closed, updates counters and metrics, and emits ForceStop.

### requestWithdrawPrincipal(uint256 _stakeId, uint256 exp, bytes sig) external nonReentrant
- Validates signature; marks stake closed and updates metrics, emitting WithdrawPrincipalRequested.

### withdrawPrincipal(uint256 _stakeId, uint256 exp, bytes sig) external nonReentrant
- Validates signature, requires stake closed and not withdrawn.
- Transfers principal from stakingPoolAndReward to user.
- If locked amount exists and is the user’s current locked context, releases locking tokens and resets tokenLocked and user.totalLocked.
- Emits WithdrawnPrincipal.

### withdrawInterest(uint256 _stakeId, uint256[] _months, uint256[] _interests, uint256 exp, bytes sig) external nonReentrant
- Validates arrays and signature over payload including months and interests.
- For each month:
  - Validates month within interestLimiter window
  - Interest > 0 and ≤ monthlyInterest
  - Ensures not already withdrawn for that month
  - Records WithdrawalInterest
  - Updates withdrawal counts
- Transfers total interest from stakingPoolAndReward to user.
- Updates totalRewardDistribution and user.lastWithdraw; emits InterestWithdrawn.

## Read Views
### getTierMinimumLocked(Tier tier) public view returns (uint256)
- Returns per-tier minimum locked thresholds.

### validateStakeConditions(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked) internal view
- Validation helper for executeStaking (detailed above).

### handleTransfers(address staker, uint256 _stakedAmount, uint256 _lockedAmount) internal
- Moves staked amount to stakingPoolAndReward, and locked amount to lockingPool when present.

### getUserStakeInfo(address _user, UserType userType) public view returns (UserStakeInfo)
- Returns summary of balances, eligible interest, remaining allocations and attempts, tier name, and lockMode.

## Function Details
- addOrRemoveAdmin(address _admin, bool _true)
  - Purpose: Manage admin set.
  - Access: onlyOwner.
  - Emits: AdminUpdated.
-  - Source: [stable-staking-smart-contract.sol:L750-L754](../../contracts/stable-staking-smart-contract.sol#L750-L754)
- pause(), unpause()
  - Purpose: Global pause control for staking operations.
  - Access: onlyAdmin.
  - Emits: ContractStateChanged.
-  - Source: [stable-staking-smart-contract.sol:L755-L764](../../contracts/stable-staking-smart-contract.sol#L755-L764)
- updateLockMode(bool _status)
  - Purpose: Require token lock for staking when true.
  - Access: onlyAdmin.
  - Emits: LockModeUpdated.
-  - Source: [stable-staking-smart-contract.sol:L765-L774](../../contracts/stable-staking-smart-contract.sol#L765-L774)
- updateThreshold(Tier tier, uint256 value)
  - Purpose: Set per-tier minimum locked thresholds.
  - Access: onlyAdmin.
  - Emits: ThresholdUpdated.
-  - Source: [stable-staking-smart-contract.sol:L799-L816](../../contracts/stable-staking-smart-contract.sol#L799-L816)
- updateStakingPoolAndReward(address _newAddress), updateLockingPool(address _newAddress)
  - Purpose: Update pools for staking and locking tokens.
  - Access: onlyValidAddress onlyAdmin.
  - Emits: stakingPoolAndRewardUpdated / lockedTokenUpdated.
-  - Source: [stable-staking-smart-contract.sol:L817-L830](../../contracts/stable-staking-smart-contract.sol#L817-L830)
- updateBondingPeriod(uint256 _newBondingPeriod), updateWithdrawalPeriod(uint256 _newWithdrawalPeriod)
  - Purpose: Configure bonding/withdrawal waiting periods.
  - Access: onlyAdmin.
  - Emits: BondingPeriodUpdated / WithdrawalPeriodUpdated.
-  - Source: [stable-staking-smart-contract.sol:L831-L846](../../contracts/stable-staking-smart-contract.sol#L831-L846)
- updatePersonalMinStake(uint256 _newMinStake), updateInstitutionalMinStake(uint256 _newMinStake)
  - Purpose: Set minimum stake per user type.
  - Access: onlyAdmin.
  - Emits: PersonalMinStakeUpdated / InstitutionalMinStakeUpdated.
-  - Source: [stable-staking-smart-contract.sol:L847-L862](../../contracts/stable-staking-smart-contract.sol#L847-L862)
- updateTotalMaxStakingPool(uint256 _newMax)
  - Purpose: Set global staking cap.
  - Access: onlyAdmin.
  - Emits: totalMaxStakingPoolUpdated.
-  - Source: [stable-staking-smart-contract.sol:L863-L869](../../contracts/stable-staking-smart-contract.sol#L863-L869)
- updateMaxStakeForTier(Tier _tier, uint256 _newMaxStake)
  - Purpose: Limit per-tier stake amount.
  - Access: onlyAdmin.
  - Emits: MaxStakeUpdated.
-  - Source: [stable-staking-smart-contract.sol:L870-L878](../../contracts/stable-staking-smart-contract.sol#L870-L878)
- updateAdditionalInterestForTier(Tier _tier, uint256 _newInterestPPM)
  - Purpose: Set additional interest for tier in PPM.
  - Access: onlyAdmin.
  - Emits: AdditionalInterestUpdated.
-  - Source: [stable-staking-smart-contract.sol:L879-L890](../../contracts/stable-staking-smart-contract.sol#L879-L890)
- updateStakingToken(address _newAddress), updateLockingToken(address _newAddress)
  - Purpose: Update token addresses; lockingToken update refreshes tokenLock reference.
  - Access: onlyAdmin.
  - Emits: StakingTokenUpdated / LockingTokenUpdated / ContractUpdated.
-  - Source: [stable-staking-smart-contract.sol:L891-L909](../../contracts/stable-staking-smart-contract.sol#L891-L909)
- getUserTier(uint256 _lockedAmount), getGlobalUserTier(address account, UserType userType)
  - Purpose: Determine tier from locked balances and global holdings.
  - Access: public view.
-  - Source: [stable-staking-smart-contract.sol:L910-L938](../../contracts/stable-staking-smart-contract.sol#L910-L938)
- getTierName(Tier tier), getAllTiers()
  - Purpose: Human-readable tier name and overview snapshot.
  - Access: internal pure / public view.
-  - Source: [stable-staking-smart-contract.sol:L939-L1000](../../contracts/stable-staking-smart-contract.sol#L939-L1000)
- calculateStakingInterest(uint256 totalDays, uint256 totalDaysInMonth, uint256 totalStakingAmount, uint256 interestRate)
  - Purpose: Pro-rate interest based on period days.
  - Access: public pure.
-  - Source: [stable-staking-smart-contract.sol:L1001-L1018](../../contracts/stable-staking-smart-contract.sol#L1001-L1018)
- calculateMonthlyStakingInterest(uint256 stakedAmount, uint256 interestRate)
  - Purpose: Annual interest in PPM divided by 12.
  - Access: internal pure.
-  - Source: [stable-staking-smart-contract.sol:L1019-L1031](../../contracts/stable-staking-smart-contract.sol#L1019-L1031)
- addStakingPeriod(uint256 _period, uint256 _interestRate, uint256 _limiter), updateStakingPeriod(uint256 _period, uint256 _interestRate, uint256 _limiter), disableStakingPeriod(uint256 _period), enableStakingPeriod(uint256 _period, uint256 _interestRate)
  - Purpose: Manage periods and interest APR configuration.
  - Access: public/onlyAdmin.
  - Emits: StakingPeriodEvent.
-  - Source: [stable-staking-smart-contract.sol:L1032-L1107](../../contracts/stable-staking-smart-contract.sol#L1032-L1107)
- periodList()
  - Purpose: Return arrays of period configuration and counters.
  - Access: public view.
-  - Source: [stable-staking-smart-contract.sol:L1108-L1160](../../contracts/stable-staking-smart-contract.sol#L1108-L1160)
- stake(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked, uint256 exp, bytes sig)
  - Purpose: Enter staking with signature validation.
  - Access: external whenNotPaused nonReentrant.
  - Emits: Staked.
-  - Source: [stable-staking-smart-contract.sol:L1302-L1339](../../contracts/stable-staking-smart-contract.sol#L1302-L1339)
- executeStaking(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked, uint256 exp, bytes sig)
  - Purpose: Validate conditions, compute StakeParams, transfer tokens, persist stake, update metrics.
  - Access: internal.
  - Emits: Staked.
-  - Source: [stable-staking-smart-contract.sol:L1161-L1238](../../contracts/stable-staking-smart-contract.sol#L1161-L1238)
- createStakeInfo(address user, StakeParams params)
  - Purpose: Allocate stake id and set StakeInfo.
  - Access: internal.
-  - Source: [stable-staking-smart-contract.sol:L1239-L1287](../../contracts/stable-staking-smart-contract.sol#L1239-L1287)
- updateTokenLockedInfo(address user, StakeParams params)
  - Purpose: Update tokenLocked[user] context.
  - Access: internal.
-  - Source: [stable-staking-smart-contract.sol:L1288-L1301](../../contracts/stable-staking-smart-contract.sol#L1288-L1301)
- getTierMinimumLocked(Tier tier)
  - Purpose: Read per-tier minimum locked thresholds.
  - Access: public view.
-  - Source: [stable-staking-smart-contract.sol:L1340-L1347](../../contracts/stable-staking-smart-contract.sol#L1340-L1347)
- validateStakeConditions(UserType _userType, uint256 _period, uint256 _stakedAmount, bool _isTokenLocked)
  - Purpose: Enforce conditions for staking, including lockMode rules.
  - Access: internal view.
  - Source: [stable-staking-smart-contract.sol:L1348-L1403](../../contracts/stable-staking-smart-contract.sol#L1348-L1403)
- handleTransfers(address staker, uint256 _stakedAmount, uint256 _lockedAmount)
  - Purpose: Move staked and locked amounts to respective pools.
  - Access: internal.
  - Source: [stable-staking-smart-contract.sol:L1404-L1418](../../contracts/stable-staking-smart-contract.sol#L1404-L1418)
- forceStop(uint256 _stakeId, address _staker)
  - Purpose: Admin closes stake early and updates metrics.
  - Access: external onlyAdmin nonReentrant.
  - Emits: ForceStop.
  - Source: [stable-staking-smart-contract.sol:L1419-L1451](../../contracts/stable-staking-smart-contract.sol#L1419-L1451)
- requestWithdrawPrincipal(uint256 _stakeId, uint256 exp, bytes sig)
  - Purpose: Request principal withdrawal; marks closed and updates metrics.
  - Access: external nonReentrant.
  - Emits: WithdrawPrincipalRequested.
  - Source: [stable-staking-smart-contract.sol:L1460-L1523](../../contracts/stable-staking-smart-contract.sol#L1460-L1523)
- withdrawPrincipal(uint256 _stakeId, uint256 exp, bytes sig)
  - Purpose: Withdraw principal after request; releases lock when applicable.
  - Access: external nonReentrant.
  - Emits: WithdrawnPrincipal.
  - Source: [stable-staking-smart-contract.sol:L1524-L1577](../../contracts/stable-staking-smart-contract.sol#L1524-L1577)
- withdrawInterest(uint256 _stakeId, uint256[] _months, uint256[] _interests, uint256 exp, bytes sig)
  - Purpose: Withdraw monthly interest with per-month validations.
  - Access: external nonReentrant.
  - Emits: InterestWithdrawn.
  - Source: [stable-staking-smart-contract.sol:L1578-L1661](../../contracts/stable-staking-smart-contract.sol#L1578-L1661)
- getUserStakeInfo(address _user, UserType userType)
  - Purpose: Summary view for UI of balances and allocations.
  - Access: public view.
  - Source: [stable-staking-smart-contract.sol:L1662-L1700](../../contracts/stable-staking-smart-contract.sol#L1662-L1700)

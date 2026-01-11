# DPToken Contract Documentation

## Overview
- Implements an ERC20 token with pause control, blacklist/whitelist enforcement, staking-locked balances, and Uniswap v4-aware buy tax.
- Inherits ERC20, Ownable, Pausable, ReentrancyGuard.
- Adds helpers and events to integrate with external staking contracts and Uniswap v4 components.

## Key Addresses
- receiver: initial supply recipient
- taxAddress: receives buy tax on Uniswap v4 buys
- V4PoolManager, V4Router, Permit2: Uniswap v4 integration addresses

## Storage
- BUY_TAX: uint24, parts-per-million (PPM) tax on Uniswap v4 buys
- DEBUG: boolean to emit UniswapDebug events
- tokenLocked[address]: amount locked by staking
- stakingContract[address]: authorized contracts allowed to update locks
- blacklist[address], whitelist[address]: transfer policy sets

## Events
- BuyTaxPercentageUpdated(uint24 newBuyTaxPercentage)
- TaxAddressUpdated(address newTaxAddress)
- V4PoolManagerUpdated(address newV4PoolManager)
- V4RouterUpdated(address newV4Router)
- Permit2Updated(address newPermit2)
- BlacklistUpdated(address account, bool isBlacklisted)
- WhitelistUpdated(address account, bool isWhitelisted)
- DebugUpdated(bool newDebug)
- TokenLockedUpdated(address account, uint256 lockedAmount)
- StakingContractUpdated(address account, bool status)
- UniswapDebug(address sender, address from, address to, uint256 value)

## Modifiers
- onlyStakingContract: restricts updates to tokenLocked to authorized staking contracts

## Constructor
### constructor(address _receiver, address _taxAddress, uint24 _buyTax)
- Purpose: Initialize supply, tax configuration, and initial policy.
- Parameters: _receiver (mint recipient), _taxAddress (tax collector), _buyTax (PPM).
- Returns: none.
- Access: public.
- Emits: none.
- Requirements: _receiver != 0, _taxAddress != 0, _buyTax ≤ 1,000,000.
- Effects: Mints 100,000,000 tokens to _receiver; whitelists _receiver and _taxAddress; sets BUY_TAX.
- Source: [dp-token-smart-contract.sol:L820-L823](contracts/dp-token-smart-contract.sol#L820-L823)

## Configuration Functions
### updateBuyTaxPercentage(uint24 newBuyTaxPercentage) onlyOwner
- Purpose: Update BUY_TAX used for Uniswap v4 buy transfers.
- Parameters: newBuyTaxPercentage (PPM, 1e6 = 100%).
- Returns: none.
- Access: onlyOwner.
- Emits: BuyTaxPercentageUpdated.
- Requirements: newBuyTaxPercentage ≤ 1,000,000.
- Source: [dp-token-smart-contract.sol:L885-L895](contracts/dp-token-smart-contract.sol#L885-L895)

### updateTaxAddress(address newTaxAddress) onlyOwner
- Purpose: Set destination for collected buy tax.
- Parameters: newTaxAddress.
- Returns: none.
- Access: onlyOwner.
- Emits: TaxAddressUpdated.
- Requirements: newTaxAddress != 0.
- Source: [dp-token-smart-contract.sol:L897-L902](contracts/dp-token-smart-contract.sol#L897-L902)

### updateV4PoolManager(address newV4PoolManager) onlyOwner
### updateV4Router(address newV4Router) onlyOwner
### updatePermit2(address newPermit2) onlyOwner
- Purpose: Configure Uniswap v4 integration endpoints.
- Parameters: newV4PoolManager/newV4Router/newPermit2.
- Returns: none.
- Access: onlyOwner.
- Emits: V4PoolManagerUpdated/V4RouterUpdated/Permit2Updated.
- Requirements: each address != 0.
- Source: [dp-token-smart-contract.sol:L906-L926](contracts/dp-token-smart-contract.sol#L906-L926)

### setStakingContract(address account, bool status) onlyOwner
- Purpose: Authorize staking contracts to adjust locked balances.
- Parameters: account (contract), status (bool).
- Returns: none.
- Access: onlyOwner.
- Emits: StakingContractUpdated.
- Requirements: account != 0.
- Source: [dp-token-smart-contract.sol:L876-L883](contracts/dp-token-smart-contract.sol#L876-L883)

### setDebug(bool newDebug) onlyOwner
- Purpose: Enable/disable UniswapDebug emission for transfers.
- Parameters: newDebug.
- Returns: none.
- Access: onlyOwner.
- Emits: DebugUpdated.
- Requirements: none.
- Source: [dp-token-smart-contract.sol:L960-L963](contracts/dp-token-smart-contract.sol#L960-L963)

## Policy Management
### addBlacklist(address account) onlyOwner
- Purpose: Block an address from initiating/receiving transfers.
- Parameters: account.
- Returns: none.
- Access: onlyOwner.
- Emits: BlacklistUpdated(account, true).
- Requirements: account != 0, not whitelisted, not already blacklisted.
- Source: [dp-token-smart-contract.sol:L930-L936](contracts/dp-token-smart-contract.sol#L930-L936)

### removeFromBlacklist(address account) onlyOwner
- Purpose: Unblock an address previously blacklisted.
- Parameters: account.
- Returns: none.
- Access: onlyOwner.
- Emits: BlacklistUpdated(account, false).
- Requirements: account != 0, currently blacklisted.
- Source: [dp-token-smart-contract.sol:L938-L943](contracts/dp-token-smart-contract.sol#L938-L943)

### addWhitelist(address account) onlyOwner
- Purpose: Allow transfers even when paused and treat as trusted.
- Parameters: account.
- Returns: none.
- Access: onlyOwner.
- Emits: WhitelistUpdated(account, true).
- Requirements: account != 0, not blacklisted, not already whitelisted.
- Source: [dp-token-smart-contract.sol:L945-L951](contracts/dp-token-smart-contract.sol#L945-L951)

### removeFromWhitelist(address account) onlyOwner
- Purpose: Remove trusted status from an address.
- Parameters: account.
- Returns: none.
- Access: onlyOwner.
- Emits: WhitelistUpdated(account, false).
- Requirements: account != 0, currently whitelisted.
- Source: [dp-token-smart-contract.sol:L953-L958](contracts/dp-token-smart-contract.sol#L953-L958)

## Staking Lock Integration
### updateLockedAmount(address account, uint256 amount, bool increase) onlyStakingContract
- Purpose: Synchronize tokenLocked with external staking lifecycle.
- Parameters: account, amount, increase (true=lock more; false=unlock).
- Returns: none.
- Access: onlyStakingContract.
- Emits: TokenLockedUpdated(account, newLockedAmount).
- Requirements: account != 0; on decrease, tokenLocked[account] ≥ amount.
- Source: [dp-token-smart-contract.sol:L854-L874](contracts/dp-token-smart-contract.sol#L854-L874)

## Uniswap v4 Helpers
### isWhitelistedOrUniswapAdress(address _address) public view returns (bool)
- Purpose: Gate pause policy for trusted actors (whitelist and v4).
- Parameters: _address.
- Returns: bool.
- Access: public view.
- Emits: none.
- Requirements: none.
- Source: [dp-token-smart-contract.sol:L985-L995](contracts/dp-token-smart-contract.sol#L985-L995)

### isUniswapRouter(address _to) internal view returns (bool)
### isUniswapV4Manager(address _address) internal view returns (bool)
### isUniswapV4Router(address _address) internal view returns (bool)
### isUniswapV4(address _address) internal view returns (bool)
- Purpose: Identify specific v4 endpoints for transfer logic.
- Access: internal view.
- Source: [dp-token-smart-contract.sol:L997-L1016](contracts/dp-token-smart-contract.sol#L997-L1016)

### isContract(address account) internal view returns (bool)
- Purpose: Distinguish contracts from EOAs using extcodesize.
- Returns: bool.
- Access: internal view.
- Caveat: Heuristic; false positives/negatives possible around construction.
- Source: [dp-token-smart-contract.sol:L973-L983](contracts/dp-token-smart-contract.sol#L973-L983)

## Math Helpers
### calculateFee(uint256 _amount, uint24 percentage) public pure returns (uint256)
- Purpose: Calculate fee in PPM for buy-tax application.
- Parameters: _amount, percentage (PPM).
- Returns: fee (uint256).
- Access: public pure.
- Emits: none.
- Requirements: percentage ≤ 1,000,000 (1e6).
- Source: [dp-token-smart-contract.sol:L1020-L1027](contracts/dp-token-smart-contract.sol#L1020-L1027)

## ERC20 Overrides and Extensions
### decimals() public view override returns (uint8)
- Purpose: Fixed token precision.
- Returns: 18.
- Source: [dp-token-smart-contract.sol:L825-L827](contracts/dp-token-smart-contract.sol#L825-L827)

### increaseAllowance(address spender, uint256 addedValue) public returns (bool)
### decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool)
- Purpose: Manage spender allowances ergonomically.
- Returns: true on success.
- Access: public.
- Requirements: For decrease, subtractedValue ≤ current allowance.
- Source: [dp-token-smart-contract.sol:L829-L852](contracts/dp-token-smart-contract.sol#L829-L852)

## Transfer Logic (Customized)
### transfer(address _to, uint256 _value) public override returns (bool)
- Purpose: ERC20 transfer with blacklist, pause, and v4 buy-tax logic.
- Parameters: _to, _value.
- Returns: true on success.
- Access: public override.
- Emits: UniswapDebug (optional).
- Requirements: sender/recipient not blacklisted; pause gates for non-whitelist/v4; sufficient unlocked balance.
- Behavior: Detects v4 buy (manager→EOA); applies BUY_TAX to taxAddress; transfers valueAfterTax to recipient.
- Source: [dp-token-smart-contract.sol:L1029-L1081](contracts/dp-token-smart-contract.sol#L1029-L1081)

### transferFrom(address _from, address _to, uint256 _value) public override returns (bool)
- Purpose: Delegated transfer with allowance, blacklist, pause, and v4 tax.
- Parameters: _from, _to, _value.
- Returns: true on success.
- Access: public override.
- Emits: UniswapDebug (optional).
- Requirements: allowance sufficient; sender/recipient not blacklisted; pause gates; unlocked balance ≥ _value.
- Behavior: Detects v4 buy and applies BUY_TAX, then transfers valueAfterTax.
- Source: [dp-token-smart-contract.sol:L1083-L1141](contracts/dp-token-smart-contract.sol#L1083-L1141)

### _tokenTransfer(address _from, address _to, uint256 _value) private returns (bool)
- Purpose: Internal transfer primitive enforcing staking locks.
- Returns: true.
- Access: private.
- Requirements: balance ≥ _value; balance - tokenLocked[_from] ≥ _value.
- Effects: Calls ERC20 super._transfer.
- Source: [dp-token-smart-contract.sol:L1143-L1159](contracts/dp-token-smart-contract.sol#L1143-L1159)

## Inherited Administration
### owner() public view returns (address)
### transferOwnership(address newOwner) public onlyOwner
### renounceOwnership() public onlyOwner
- Purpose: Ownership lifecycle management.
- Access: public / onlyOwner.
- Source: [dp-token-smart-contract.sol:L658-L678](contracts/dp-token-smart-contract.sol#L658-L678)

## Pause Control
### pause() public onlyOwner whenNotPaused
### unpause() public onlyOwner whenPaused
- Purpose: Global circuit breaker for transfers.
- Access: onlyOwner.
- Effects: Toggle paused state; enforced in transfer policies for non-whitelist/v4 actors.
- Source: [dp-token-smart-contract.sol:L694-L732](contracts/dp-token-smart-contract.sol#L694-L732)

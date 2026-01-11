# GovernanceDAO Contract Documentation

## Overview
- On-chain proposal and voting DAO with configurable eligibility rules and voting methods.
- Integrates with StableStaking contracts to evaluate user tiers and staking status.
- Supports sessions, proposal lifecycle, and multiple vote weight strategies.

## External Contracts
- IERC20 tokenLock: exposes tokenLocked(), balanceOf(), totalSupply()
- STABLESTAKE usdtStake, usdcStake: exposes users(address) -> UserInfo

## Enums
- Tier: NoTier, Bronze, Silver, Gold, VIP
- VoteMethod: TierPoint, HoldingPercentage, CappedHoldingPercentage
- Status: Submitted, Chosen, Passed, Failed, Applied, Created, Cancelled, Archived

## Storage
- MIN_*_THRESHOLD: tier thresholds in tokenLock units
- tokenLock, usdtStake, usdcStake: contract references
- isAdmin[address]: admin set
- proposalCounter: sequential id
- PERCENTAGE_BASE: 1,000,000 (PPM base for percentages)
- MAX_CAPPED_PERCENTAGE: cap used in CappedHoldingPercentage mode
- MAX_PROPOSALS_PER_SESSION: per-session submission limit
- VOTING_DURATION: proposal active duration
- voteMethod: selected VoteMethod
- daoPaused: pause flag
- activeProposalId: proposal id currently active
- noRulesVote, noRulesProposal: baseline tiers for no rules mode
- withRulesVoteConfig, withRulesProposalConfig: toggles rules mode
- sessionCounter: current session id
- sessions[sessionId] => Session
- sessionSubmittedProposals[sessionId][index] => proposalId
- sessionSubmittedCounts[sessionId] => count
- proposalToSession[proposalId] => sessionId
- proposals[proposalId] => Proposal
- proposalVoteDetails[proposalId][voter] => VoteDetail
- finalizedVotes[proposalId][choiceIndex] => weight
- proposalVoters[proposalId] => list of voters
- hasCreatedProposalInSession[sessionId][creator] => bool

## Events
- RulesVoteConfigUpdated(bool newValue, address updatedBy)
- RulesProposalConfigUpdated(bool newValue, address updatedBy)
- ProposalSubmitted(address creator, uint256 proposalId, uint256 sessionId, string title, string description, string status, string[] choices)
- ProposalCreated(address creator, uint256 proposalId, uint256 sessionId, uint256 referenceId, string title, string description, string status, uint256 startTime, uint256 endTime, string[] choices)
- Voted(uint256 proposalId, address voter, uint256 choiceIndex, uint256 weight, VoteMethod method)
- ProposalCancelled(uint256 proposalId, uint256 referenceId)
- ProposalStatusUpdated(uint256 proposalId, Status newStatus)
- DAOStatusUpdated(bool paused)
- SessionClosed(uint256 sessionId, uint256 proposalId, uint256 referenceId, string otherStatus)
- AdminUpdated(address admin, bool isAdmin)
- ContractUpdated(string contractType, address oldAddress, address newAddress)
- NoRulesVoteTierUpdated(Tier oldVoteTier, Tier newVoteTier)
- NoRulesProposalTierUpdated(Tier oldProposalTier, Tier newProposalTier)
- MaxProposalsPerSessionUpdated(uint256 oldLimit, uint256 newLimit)
- MaxPercentageUpdated(uint256 oldMaxPercentage, uint256 newMaxPercentage)
- TierThresholdsUpdated(oldVIP, newVIP, oldGold, newGold, oldSilver, newSilver, oldBronze, newBronze)
- SessionCreated(uint256 sessionId, uint256 sessionTime)

## Modifiers
- onlyAdmin: admin or owner
- whenNotPaused: requires daoPaused == false

## Admin Management
### addOrRemoveAdmin(address _admin, bool _isAdminStatus) onlyOwner
- Grants/revokes admin rights for _admin.

## Sessions
### createSession() onlyAdmin returns (uint256)
- Creates a new long-lived session (default expiry ~365 days).
- Requires previous session expired if it exists.
- Increments sessionCounter and emits SessionCreated.

## Baseline Tier Configs
### updateNoRulesVoteTier(Tier _newVoteTier) onlyAdmin
### updateNoRulesProposalTier(Tier _newProposalTier) onlyAdmin
- Updates baseline tiers for no rules mode, emitting corresponding events.

## Rules Toggles
### updateRulesVoteConfig(bool _newValue) onlyAdmin
### updateRulesProposalConfig(bool _newValue) onlyAdmin
- Toggles rule-based eligibility (withRulesVoteConfig / withRulesProposalConfig).
- Rejects redundant updates.

## Eligibility Checks
### withRulesVote(address _user) public view returns (bool)
- True if user has active stake in either stake contract and tier ≥ Bronze.

### withRulesProposal(address _user) public view returns (bool)
- True if user has active stake and tier ≥ Gold.

### noRulesPermission(address _user, Tier requiredTier) public view returns (bool)
- True if getTier(_user) ≥ requiredTier.

### checkEligibility(address _user, bool _isForProposal) public view returns (bool)
- Chooses appropriate eligibility path based on rules config.

## Contract References
### updateTokenLock(address _newTokenLock) onlyAdmin
### updateUsdtStake(address _newUsdtStake) onlyAdmin
### updateUsdcStake(address _newUsdcStake) onlyAdmin
- Updates external contract addresses and emits ContractUpdated.

## Tier Thresholds and Percentages
### updateTierThresholds(uint256 _vip, uint256 _gold, uint256 _silver, uint256 _bronze) onlyAdmin
- Validates ordering and updates MIN_* thresholds.
- Emits TierThresholdsUpdated with old/new values.

### getTier(address account) public view returns (Tier)
- Derives tier based on available + locked balances in tokenLock.

### setMaxPercentage(uint256 _percent) onlyAdmin
- Sets MAX_CAPPED_PERCENTAGE in PPM; ≤ PERCENTAGE_BASE.
- Emits MaxPercentageUpdated.

### updateMaxProposalsPerSession(uint256 _newLimit) onlyAdmin
- Adjusts session proposal capacity; emits change event.

## Vote Weight Calculations
### getTotalSupply() public view returns (uint256)
- tokenLock.totalSupply() passthrough.

### calculateVotePercentage(address account) public view returns (uint256)
- PPM percentage of account’s total holdings over total supply.

### cappedPercentage(address account) public view returns (uint256)
- Returns min(calculateVotePercentage, MAX_CAPPED_PERCENTAGE).

## Status Helpers
### getStatusString(Status status) internal pure returns (string)
- Converts Status to string for events.

## Proposal Lifecycle
### submitProposal(string _title, string _description, string[] _choices) external whenNotPaused
- Eligibility depends on rules config and baseline tier.
- Auto-creates a new session if current has expired.
- Enforces active proposal absence, per-session limit, and per-creator restriction.
- Creates proposal in Submitted state and indexes it in session storage.

### selectProposal(uint256 _proposalId, string _newTitle, string _newDescription, string[] _newChoices) external onlyAdmin
- Optionally references an existing Submitted proposal, marking it Chosen.
- Creates a new proposal in Created state with voting window [start, end].
- Archives other Submitted proposals in the session.
- Marks proposal active and updates session’s selectedProposalId and end time.

## Voting
### vote(uint256 _proposalId, uint256 _choiceIndex) external whenNotPaused nonReentrant
- Eligibility based on rules/tier config.
- Requires within session/proposal windows, valid choice, and not previously voted by sender.
- Weight determined by voteMethod:
  - TierPoint: VIP=4, Gold=3, Silver=2, Bronze=1, NoTier=0
  - HoldingPercentage: calculateVotePercentage(sender)
  - CappedHoldingPercentage: min(calculateVotePercentage(sender), MAX_CAPPED_PERCENTAGE)
- Aggregates in finalizedVotes and persists VoteDetail.

## Admin Proposal Management
### cancelProposal(uint256 _proposalId) external onlyAdmin
- Cancels active proposal, marks reference proposal Failed when relevant.
- Ends current session and creates the next session window.

### updateProposalStatus(uint256 _proposalId, Status _status) external onlyAdmin
- Sets status to Passed/Failed/Applied and clears activeProposalId if matching.

### updateVotingDuration(uint256 _days) external onlyAdmin
- Sets voting duration in days; requires ≥ 1 day.

### setVoteMethod(VoteMethod _method) external onlyAdmin
- Updates vote method; disallows change while an active proposal is ongoing.

### pauseDAO(bool _pause) external onlyAdmin
- Toggles DAO pause and emits DAOStatusUpdated.

## Read Views
### getProposalVote(uint256 _proposalId, uint256 _choiceIndex) external view returns (uint256)
- Returns aggregated votes for choice index.

### getFinalizedVotes(uint256 _proposalId) external view returns (uint256[] memory)
- Returns all choice totals for given proposal.

### getWinningChoice(uint256 _proposalId) external view returns (uint256 winningChoiceIndex, uint256 winningWeight)
- Finds highest vote choice and returns its index and weight.

### getActiveProposal() external view returns (Proposal memory)
- Returns current session’s selected proposal unless session expired.

## Function Details
- addOrRemoveAdmin(address _admin, bool _isAdminStatus)
  - Purpose: Manage DAO admin set.
  - Parameters: _admin, _isAdminStatus.
  - Returns: none.
  - Access: onlyOwner.
  - Emits: AdminUpdated.
  - Source: [governance-dao-smart-contract.sol:L213-L221](contracts/governance-dao-smart-contract.sol#L213-L221)
- createSession()
  - Purpose: Start a new DAO voting session.
  - Parameters: none.
  - Returns: sessionId.
  - Access: onlyAdmin.
  - Emits: SessionCreated.
  - Requirements: previous session must be expired if present.
  - Source: [governance-dao-smart-contract.sol:L221-L241](contracts/governance-dao-smart-contract.sol#L221-L241)
- updateNoRulesVoteTier(Tier _newVoteTier), updateNoRulesProposalTier(Tier _newProposalTier)
  - Purpose: Configure baseline tiers for no-rules eligibility.
  - Access: onlyAdmin.
  - Emits: NoRulesVoteTierUpdated / NoRulesProposalTierUpdated.
  - Source: [governance-dao-smart-contract.sol:L242-L258](contracts/governance-dao-smart-contract.sol#L242-L258)
- updateRulesVoteConfig(bool _newValue), updateRulesProposalConfig(bool _newValue)
  - Purpose: Toggle rule-based eligibility paths.
  - Access: onlyAdmin.
  - Emits: RulesVoteConfigUpdated / RulesProposalConfigUpdated.
  - Requirements: new value differs from current.
  - Source: [governance-dao-smart-contract.sol:L259-L277](contracts/governance-dao-smart-contract.sol#L259-L277)
- withRulesVote(address _user)
  - Purpose: Check voting eligibility under rules mode.
  - Returns: bool.
  - Source: [governance-dao-smart-contract.sol:L278-L292](contracts/governance-dao-smart-contract.sol#L278-L292)
- withRulesProposal(address _user)
  - Purpose: Check proposal creation eligibility under rules mode.
  - Returns: bool.
  - Source: [governance-dao-smart-contract.sol:L293-L306](contracts/governance-dao-smart-contract.sol#L293-L306)
- noRulesPermission(address _user, Tier requiredTier)
  - Purpose: Permission check under no-rules mode using tiers.
  - Returns: bool.
  - Source: [governance-dao-smart-contract.sol:L307-L325](contracts/governance-dao-smart-contract.sol#L307-L325)
- checkEligibility(address _user, bool _isForProposal)
  - Purpose: Route eligibility based on rules toggles.
  - Returns: bool.
  - Source: [governance-dao-smart-contract.sol:L326-L347](contracts/governance-dao-smart-contract.sol#L326-L347)
- updateTokenLock(address _newTokenLock), updateUsdtStake(address _newUsdtStake), updateUsdcStake(address _newUsdcStake)
  - Purpose: Update external contract references.
  - Emits: ContractUpdated(contractType, oldAddress, newAddress).
  - Source: [governance-dao-smart-contract.sol:L348-L364](contracts/governance-dao-smart-contract.sol#L348-L364)
- updateTierThresholds(uint256 _vip, uint256 _gold, uint256 _silver, uint256 _bronze)
  - Purpose: Set tier thresholds in token units.
  - Emits: TierThresholdsUpdated(old/new thresholds).
  - Requirements: _vip ≥ _gold ≥ _silver ≥ _bronze.
  - Source: [governance-dao-smart-contract.sol:L371-L410](contracts/governance-dao-smart-contract.sol#L371-L410)
- getTier(address account)
  - Purpose: Determine user tier from tokenLock holdings.
  - Returns: Tier.
  - Source: [governance-dao-smart-contract.sol:L411-L428](contracts/governance-dao-smart-contract.sol#L411-L428)
- setMaxPercentage(uint256 _percent)
  - Purpose: Configure cap for CappedHoldingPercentage.
  - Emits: MaxPercentageUpdated(old, new).
  - Requirements: _percent ≤ PERCENTAGE_BASE.
  - Source: [governance-dao-smart-contract.sol:L429-L437](contracts/governance-dao-smart-contract.sol#L429-L437)
- updateMaxProposalsPerSession(uint256 _newLimit)
  - Purpose: Limit per-session submissions.
  - Emits: MaxProposalsPerSessionUpdated(old, new).
  - Source: [governance-dao-smart-contract.sol:L438-L448](contracts/governance-dao-smart-contract.sol#L438-L448)
- getTotalSupply()
  - Purpose: Fetch total supply from tokenLock.
  - Returns: uint256.
  - Source: [governance-dao-smart-contract.sol:L449-L452](contracts/governance-dao-smart-contract.sol#L449-L452)
- calculateVotePercentage(address account)
  - Purpose: Compute PPM holding percentage for account.
  - Returns: uint256.
  - Source: [governance-dao-smart-contract.sol:L453-L462](contracts/governance-dao-smart-contract.sol#L453-L462)
- cappedPercentage(address account)
  - Purpose: Min(calculateVotePercentage, MAX_CAPPED_PERCENTAGE).
  - Returns: uint256.
  - Source: [governance-dao-smart-contract.sol:L463-L470](contracts/governance-dao-smart-contract.sol#L463-L470)
- getStatusString(Status status)
  - Purpose: Status enum → string for event payloads.
  - Returns: string.
  - Source: [governance-dao-smart-contract.sol:L471-L484](contracts/governance-dao-smart-contract.sol#L471-L484)
- submitProposal(string _title, string _description, string[] _choices)
  - Purpose: Submit a proposal into the current session.
  - Access: external whenNotPaused.
  - Emits: ProposalSubmitted.
  - Requirements: eligible, no active proposal, session not at capacity, sender not previously created in session.
  - Source: [governance-dao-smart-contract.sol:L485-L575](contracts/governance-dao-smart-contract.sol#L485-L575)
- selectProposal(uint256 _proposalId, string _newTitle, string _newDescription, string[] _newChoices)
  - Purpose: Promote a proposal to Created and open voting.
  - Access: onlyAdmin.
  - Emits: ProposalCreated.
  - Source: [governance-dao-smart-contract.sol:L581-L663](contracts/governance-dao-smart-contract.sol#L581-L663)
- vote(uint256 _proposalId, uint256 _choiceIndex)
  - Purpose: Cast a vote with method-dependent weight.
  - Access: external whenNotPaused nonReentrant.
  - Emits: Voted.
  - Source: [governance-dao-smart-contract.sol:L678-L750](contracts/governance-dao-smart-contract.sol#L678-L750)
- cancelProposal(uint256 _proposalId)
  - Purpose: Cancel active Created proposal and roll session forward.
  - Access: onlyAdmin.
  - Emits: ProposalCancelled.
  - Source: [governance-dao-smart-contract.sol:L751-L778](contracts/governance-dao-smart-contract.sol#L751-L778)
- updateProposalStatus(uint256 _proposalId, Status _status)
  - Purpose: Finalize proposal outcome or apply status.
  - Access: onlyAdmin.
  - Emits: ProposalStatusUpdated.
  - Source: [governance-dao-smart-contract.sol:L779-L798](contracts/governance-dao-smart-contract.sol#L779-L798)
- updateVotingDuration(uint256 _days)
  - Purpose: Configure voting window duration.
  - Requirements: _days ≥ 1.
  - Source: [governance-dao-smart-contract.sol:L799-L803](contracts/governance-dao-smart-contract.sol#L799-L803)
- setVoteMethod(VoteMethod _method)
  - Purpose: Switch vote weighting scheme.
  - Requirements: cannot change while an active proposal is ongoing (endTime passed).
  - Source: [governance-dao-smart-contract.sol:L804-L811](contracts/governance-dao-smart-contract.sol#L804-L811)
- pauseDAO(bool _pause)
  - Purpose: Pause/unpause the DAO operations.
  - Emits: DAOStatusUpdated.
  - Source: [governance-dao-smart-contract.sol:L812-L816](contracts/governance-dao-smart-contract.sol#L812-L816)
- getProposalVote(uint256 _proposalId, uint256 _choiceIndex)
  - Purpose: Read aggregated votes for a choice.
  - Returns: uint256.
  - Source: [governance-dao-smart-contract.sol:L817-L823](contracts/governance-dao-smart-contract.sol#L817-L823)
- getFinalizedVotes(uint256 _proposalId)
  - Purpose: Read all finalized votes for proposal.
  - Returns: uint256[].
  - Source: [governance-dao-smart-contract.sol:L824-L836](contracts/governance-dao-smart-contract.sol#L824-L836)
- getWinningChoice(uint256 _proposalId)
  - Purpose: Determine winning choice by highest weight.
  - Returns: winningChoiceIndex, winningWeight.
  - Source: [governance-dao-smart-contract.sol:L837-L860](contracts/governance-dao-smart-contract.sol#L837-L860)
- getActiveProposal()
  - Purpose: Read current session’s active proposal.
  - Returns: Proposal memory.
  - Source: [governance-dao-smart-contract.sol:L861-L869](contracts/governance-dao-smart-contract.sol#L861-L869)

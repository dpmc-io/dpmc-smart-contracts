// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function tokenLocked(address account) external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function totalSupply() external view returns (uint256);
}

interface STABLESTAKE {
    enum UserType {
        Personal,
        Institutional
    }

    struct UserInfo {
        UserType userType;
        uint256 totalStaked;
        uint256 totalLocked;
        uint256 stakeCount;
    }

    function users(address user) external view returns (UserInfo memory);
}

contract GovernanceDAO is Ownable(msg.sender), ReentrancyGuard {
    enum Tier {
        NoTier,
        Bronze,
        Silver,
        Gold,
        VIP
    }

    enum VoteMethod {
        TierPoint,
        HoldingPercentage,
        CappedHoldingPercentage
    }

    enum Status {
        Submitted,
        Chosen,
        Passed,
        Failed,
        Applied,
        Created,
        Cancelled,
        Archived
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        string[] choices;
        address creator;
        Status status;
        uint256 startTime;
        uint256 endTime;
        uint256 sessionId; // Session ID for the proposal
        uint256 referenceId;
    }

    struct VoteDetail {
        uint256 proposalId;
        uint256 choiceIndex;
        address voter;
        uint256 weight;
        VoteMethod method;
    }

    struct Session {
        uint256 sessionId;
        uint256 selectedProposalId;
        uint256 sessionTime;
    }

    uint256 public MIN_VIP_THRESHOLD = 2_000_000 * 10 ** 18;
    uint256 public MIN_GOLD_THRESHOLD = 1_000_000 * 10 ** 18;
    uint256 public MIN_SILVER_THRESHOLD = 500_000 * 10 ** 18;
    uint256 public MIN_BRONZE_THRESHOLD = 100_000 * 10 ** 18;

    IERC20 public tokenLock =
        IERC20(0xb63683C2d9563C25F65793164a282eF82C0A03F6);
    STABLESTAKE public usdtStake =
        STABLESTAKE(0x6EA6da32ebcDc3Db24c52Aa2BA2c12BbE1499299);
    STABLESTAKE public usdcStake =
        STABLESTAKE(0x8c4708eEbBE7f0B768D7bB6E900f894F7E7d6255);

    mapping(address => bool) public isAdmin;
    uint256 public proposalCounter;
    uint256 public constant PERCENTAGE_BASE = 1_000_000; // 100% = 1,000,000
    uint256 public MAX_CAPPED_PERCENTAGE = 30_000; // 3%
    uint256 public MAX_PROPOSALS_PER_SESSION = 10; // Default limit, can be configured
    // uint256 public VOTING_DURATION = 7 days;
    uint256 public VOTING_DURATION = 10 minutes;
    VoteMethod public voteMethod = VoteMethod.TierPoint;
    bool public daoPaused;
    uint256 public activeProposalId;
    Tier noRulesVote = Tier.Bronze;
    Tier noRulesProposal = Tier.Gold;

    bool public withRulesVoteConfig = false;
    bool public withRulesProposalConfig = false;

    uint256 public sessionCounter = 1; // Tracks voting sessions
    mapping(uint256 => Session) public sessions;

    mapping(uint256 => mapping(uint256 => uint256))
        public sessionSubmittedProposals; // sessionId => index => proposalId
    mapping(uint256 => uint256) public sessionSubmittedCounts; // sessionId => count of Submitted proposals
    mapping(uint256 => uint256) public proposalToSession; // proposalId => sessionId
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteDetail))
        public proposalVoteDetails; // proposalId => voter => VoteDetail
    mapping(uint256 => mapping(uint256 => uint256)) public finalizedVotes; // proposalId => choiceIndex => weight
    mapping(uint256 => address[]) public proposalVoters; // proposalId => list of voters
    mapping(uint256 => mapping(address => bool))
        public hasCreatedProposalInSession;

    event RulesVoteConfigUpdated(bool newValue, address updatedBy);
    event RulesProposalConfigUpdated(bool newValue, address updatedBy);

    event ProposalSubmitted(
        address creator,
        uint256 proposalId,
        uint256 sessionId,
        string title,
        string description,
        string status,
        string[] choices
    );
    event ProposalCreated(
        address creator,
        uint256 proposalId,
        uint256 sessionId,
        uint256 referenceId,
        string title,
        string description,
        string status,
        uint256 startTime,
        uint256 endTime,
        string[] choices
    );
    event Voted(
        uint256 proposalId,
        address voter,
        uint256 choiceIndex,
        uint256 weight,
        VoteMethod method
    );
    event ProposalCancelled(uint256 proposalId, uint256 referenceId);
    event ProposalStatusUpdated(uint256 proposalId, Status newStatus);
    event DAOStatusUpdated(bool paused);
    event SessionClosed(
        uint256 sessionId,
        uint256 proposalId,
        uint256 referenceId,
        string otherStatus
    );
    event AdminUpdated(address admin, bool isAdmin);

    event ContractUpdated(
        string contractType,
        address oldAddress,
        address newAddress
    );

    event NoRulesVoteTierUpdated(Tier oldVoteTier, Tier newVoteTier);
    event NoRulesProposalTierUpdated(
        Tier oldProposalTier,
        Tier newProposalTier
    );

    event MaxProposalsPerSessionUpdated(uint256 oldLimit, uint256 newLimit);

    event MaxPercentageUpdated(
        uint256 oldMaxPercentage,
        uint256 newMaxPercentage
    );

    event TierThresholdsUpdated(
        uint256 oldVIPThreshold,
        uint256 newVIPThreshold,
        uint256 oldGoldThreshold,
        uint256 newGoldThreshold,
        uint256 oldSilverThreshold,
        uint256 newSilverThreshold,
        uint256 oldBronzeThreshold,
        uint256 newBronzeThreshold
    );

    event SessionCreated(uint256 sessionId, uint256 sessionTime);

    modifier onlyAdmin() {
        require(
            isAdmin[msg.sender] || msg.sender == owner(),
            "Only the admin can perform this action."
        );
        _;
    }

    modifier whenNotPaused() {
        require(!daoPaused, "DAO is paused");
        _;
    }

    function addOrRemoveAdmin(
        address _admin,
        bool _isAdminStatus
    ) public onlyOwner {
        isAdmin[_admin] = _isAdminStatus;
        emit AdminUpdated(_admin, _isAdminStatus);
    }

    function createSession() public onlyAdmin returns (uint256) {
        // Only allow creating a new session if the previous session is expired
        if (sessionCounter > 0) {
            require(
                block.timestamp > sessions[sessionCounter].sessionTime,
                "Previous session is still active"
            );
        }
        sessionCounter++;
        uint256 newSessionId = sessionCounter;
        uint256 expiry = block.timestamp + 365 days;
        sessions[newSessionId] = Session({
            sessionId: newSessionId,
            selectedProposalId: 0,
            sessionTime: expiry
        });
        emit SessionCreated(newSessionId, expiry);
        return newSessionId;
    }

    // Function to update the noRulesVote tier
    function updateNoRulesVoteTier(Tier _newVoteTier) public onlyAdmin {
        // Emit event before the update
        emit NoRulesVoteTierUpdated(noRulesVote, _newVoteTier);

        // Update the noRulesVote tier
        noRulesVote = _newVoteTier;
    }

    // Function to update the noRulesProposal tier
    function updateNoRulesProposalTier(Tier _newProposalTier) public onlyAdmin {
        // Emit event before the update
        emit NoRulesProposalTierUpdated(noRulesProposal, _newProposalTier);

        // Update the noRulesProposal tier
        noRulesProposal = _newProposalTier;
    }

    function updateRulesVoteConfig(bool _newValue) external onlyAdmin {
        require(
            withRulesVoteConfig != _newValue,
            "Config already set to this value"
        );
        withRulesVoteConfig = _newValue;
        emit RulesVoteConfigUpdated(_newValue, msg.sender);
    }

    function updateRulesProposalConfig(bool _newValue) external onlyAdmin {
        require(
            withRulesProposalConfig != _newValue,
            "Config already set to this value"
        );
        withRulesProposalConfig = _newValue;
        emit RulesProposalConfigUpdated(_newValue, msg.sender);
    }

    // Function to check if the user has an active stake and has at least Bronze tier
    function withRulesVote(address _user) public view returns (bool) {
        // Retrieve UserInfo for both USDT and USDC stakes
        STABLESTAKE.UserInfo memory usdtUserInfo = usdtStake.users(_user);
        STABLESTAKE.UserInfo memory usdcUserInfo = usdcStake.users(_user);

        // Get the user's tier
        Tier userTier = getTier(_user);

        // Check if either of the stake counts is greater than 0 and if user has at least Bronze tier
        return
            (usdtUserInfo.stakeCount > 0 || usdcUserInfo.stakeCount > 0) &&
            userTier >= Tier.Bronze;
    }

    // Function to check if the user has an active stake and has at least Gold tier
    function withRulesProposal(address _user) public view returns (bool) {
        // Retrieve UserInfo for both USDT and USDC stakes
        STABLESTAKE.UserInfo memory usdtUserInfo = usdtStake.users(_user);
        STABLESTAKE.UserInfo memory usdcUserInfo = usdcStake.users(_user);

        // Get the user's tier
        Tier userTier = getTier(_user);

        // Check if either of the stake counts is greater than 0 and if user has at least Bronze tier
        return
            (usdtUserInfo.stakeCount > 0 || usdcUserInfo.stakeCount > 0) &&
            userTier >= Tier.Gold;
    }

    function noRulesPermission(
        address _user,
        Tier requiredTier
    ) public view returns (bool) {
        Tier userTier = getTier(_user);

        if (userTier >= requiredTier) {
            return true;
        }

        return false;
    }

    /**
     * @dev Checks if a user is eligible to vote or submit a proposal based on current DAO rules.
     * @param _user The address of the user to check.
     * @param _isForProposal A boolean flag: true for proposal eligibility, false for voting eligibility.
     * @return True if the user is eligible, false otherwise.
     */
    function checkEligibility(
        address _user,
        bool _isForProposal
    ) public view returns (bool) {
        if (_isForProposal) {
            // Check eligibility for submitting a proposal
            if (withRulesProposalConfig) {
                return withRulesProposal(_user);
            } else {
                return noRulesPermission(_user, noRulesProposal);
            }
        } else {
            // Check eligibility for voting
            if (withRulesVoteConfig) {
                return withRulesVote(_user);
            } else {
                return noRulesPermission(_user, noRulesVote);
            }
        }
    }

    // Function to update the tokenLock (IERC20 token)
    function updateTokenLock(address _newTokenLock) public onlyAdmin {
        require(_newTokenLock != address(0), "Invalid address");
        address oldAddress = address(tokenLock);
        tokenLock = IERC20(_newTokenLock);
        emit ContractUpdated("tokenLock", oldAddress, _newTokenLock);
    }

    // Function to update the usdtStake (STABLESTAKE contract for USDT)
    function updateUsdtStake(address _newUsdtStake) public onlyAdmin {
        require(_newUsdtStake != address(0), "Invalid address");
        address oldAddress = address(usdtStake);
        usdtStake = STABLESTAKE(_newUsdtStake);
        emit ContractUpdated("usdtStake", oldAddress, _newUsdtStake);
    }

    // Function to update the usdcStake (STABLESTAKE contract for USDC)
    function updateUsdcStake(address _newUsdcStake) public onlyAdmin {
        require(_newUsdcStake != address(0), "Invalid address");
        address oldAddress = address(usdcStake);
        usdcStake = STABLESTAKE(_newUsdcStake);
        emit ContractUpdated("usdcStake", oldAddress, _newUsdcStake);
    }

    function updateTierThresholds(
        uint256 _vip,
        uint256 _gold,
        uint256 _silver,
        uint256 _bronze
    ) external onlyAdmin {
        // Store old values
        uint256 oldVIP = MIN_VIP_THRESHOLD;
        uint256 oldGold = MIN_GOLD_THRESHOLD;
        uint256 oldSilver = MIN_SILVER_THRESHOLD;
        uint256 oldBronze = MIN_BRONZE_THRESHOLD;

        // Validations to ensure thresholds are in correct order
        require(_vip > _gold, "VIP threshold must be greater than Gold");
        require(_gold > _silver, "Gold threshold must be greater than Silver");
        require(
            _silver > _bronze,
            "Silver threshold must be greater than Bronze"
        );
        require(_bronze > 0, "Bronze threshold must be greater than 0");

        // Update the thresholds
        MIN_VIP_THRESHOLD = _vip;
        MIN_GOLD_THRESHOLD = _gold;
        MIN_SILVER_THRESHOLD = _silver;
        MIN_BRONZE_THRESHOLD = _bronze;

        // Emit the event with old and new values
        emit TierThresholdsUpdated(
            oldVIP,
            _vip,
            oldGold,
            _gold,
            oldSilver,
            _silver,
            oldBronze,
            _bronze
        );
    }

    function getTier(address account) public view returns (Tier tier) {
        uint256 availableBalance = tokenLock.balanceOf(account);
        uint256 totalLocked = tokenLock.tokenLocked(account);
        uint256 totalAmount = availableBalance + totalLocked;

        if (totalAmount >= MIN_VIP_THRESHOLD) {
            return Tier.VIP;
        } else if (totalAmount >= MIN_GOLD_THRESHOLD) {
            return Tier.Gold;
        } else if (totalAmount >= MIN_SILVER_THRESHOLD) {
            return Tier.Silver;
        } else if (totalAmount >= MIN_BRONZE_THRESHOLD) {
            return Tier.Bronze;
        } else if (totalAmount < MIN_BRONZE_THRESHOLD) {
            return Tier.NoTier;
        }
    }

    function setMaxPercentage(uint256 _percent) external onlyAdmin {
        uint256 oldPercentage = MAX_CAPPED_PERCENTAGE;
        require(_percent <= PERCENTAGE_BASE, "Cannot exceed 100%");

        MAX_CAPPED_PERCENTAGE = _percent;

        emit MaxPercentageUpdated(oldPercentage, _percent);
    }

    function updateMaxProposalsPerSession(
        uint256 _newLimit
    ) external onlyAdmin {
        require(_newLimit > 0, "Limit must be greater than 0");
        emit MaxProposalsPerSessionUpdated(
            MAX_PROPOSALS_PER_SESSION,
            _newLimit
        );
        MAX_PROPOSALS_PER_SESSION = _newLimit;
    }

    function getTotalSupply() public view returns (uint256) {
        return tokenLock.totalSupply();
    }

    function calculateVotePercentage(
        address account
    ) public view returns (uint256) {
        uint256 availableBalance = tokenLock.balanceOf(account);
        uint256 totalLocked = tokenLock.tokenLocked(account);
        uint256 totalAmount = availableBalance + totalLocked;
        if (getTotalSupply() == 0) return 0;
        return (totalAmount * PERCENTAGE_BASE) / getTotalSupply();
    }

    function cappedPercentage(address account) public view returns (uint256) {
        uint256 rawPercent = calculateVotePercentage(account);
        return
            rawPercent > MAX_CAPPED_PERCENTAGE
                ? MAX_CAPPED_PERCENTAGE
                : rawPercent;
    }

    function getStatusString(
        Status status
    ) internal pure returns (string memory) {
        if (status == Status.Submitted) return "Submitted";
        if (status == Status.Chosen) return "Chosen";
        if (status == Status.Passed) return "Passed";
        if (status == Status.Failed) return "Failed";
        if (status == Status.Applied) return "Applied";
        if (status == Status.Created) return "Created";
        if (status == Status.Cancelled) return "Cancelled";
        if (status == Status.Archived) return "Archived";
        return "";
    }

    function submitProposal(
        string memory _title,
        string memory _description,
        string[] memory _choices
    ) external whenNotPaused {
        // Eligibility checks
        if (withRulesProposalConfig) {
            require(
                withRulesProposal(msg.sender),
                "You are not eligible to create a proposal"
            );
        } else {
            require(
                noRulesPermission(msg.sender, noRulesProposal),
                "You are not eligible to create a proposal"
            );
        }

        require(
            _choices.length >= 2 && _choices.length <= 4,
            "Invalid choice count"
        );

        uint256 currentSessionId = sessionCounter;

        // Session expiry check and auto-create new session if expired
        if (
            sessions[currentSessionId].sessionTime > 0 &&
            block.timestamp > sessions[currentSessionId].sessionTime
        ) {
            // Create new session
            sessionCounter++;
            currentSessionId = sessionCounter;
            // Initialize the new session here (example, adjust as needed)
            sessions[currentSessionId].sessionTime =
                block.timestamp +
                VOTING_DURATION; // or your desired session duration
            sessionSubmittedCounts[currentSessionId] = 0;
            sessions[currentSessionId].selectedProposalId = 0;
            // Add any other session initialization logic here
        }

        require(
            sessions[currentSessionId].selectedProposalId == 0,
            "There is already an active proposal"
        );

        require(
            sessionSubmittedCounts[currentSessionId] <
                MAX_PROPOSALS_PER_SESSION,
            "Session has reached max proposals"
        );

        require(
            !hasCreatedProposalInSession[currentSessionId][msg.sender],
            "You have already created a proposal in this session"
        );

        proposalCounter++;

        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            title: _title,
            description: _description,
            choices: _choices,
            creator: msg.sender,
            status: Status.Submitted,
            startTime: 0,
            endTime: 0,
            sessionId: currentSessionId,
            referenceId: 0
        });

        // Store the proposal in the session
        uint256 proposalIndex = sessionSubmittedCounts[currentSessionId];
        sessionSubmittedProposals[currentSessionId][
            proposalIndex
        ] = proposalCounter;
        sessionSubmittedCounts[currentSessionId]++;

        proposalToSession[proposalCounter] = currentSessionId;

        // Mark the sender as having created a proposal in this session
        hasCreatedProposalInSession[currentSessionId][msg.sender] = true;

        emit ProposalSubmitted(
            msg.sender,
            proposalCounter,
            currentSessionId,
            _title,
            _description,
            getStatusString(Status.Submitted),
            _choices
        );
    }

    function selectProposal(
        uint256 _proposalId,
        string memory _newTitle,
        string memory _newDescription,
        string[] memory _newChoices
    ) external onlyAdmin {
        uint256 referenceId = _proposalId;
        if (referenceId != 0) {
            require(
                proposals[referenceId].creator != address(0),
                "Proposal is not exist"
            );
            require(
                proposals[referenceId].status == Status.Submitted,
                "Only submitted proposals can be selected"
            );
            Proposal storage referenceProposal = proposals[referenceId];
            referenceProposal.status = Status.Chosen;
        }

        require(
            _newChoices.length >= 2 && _newChoices.length <= 4,
            "Invalid choice count"
        );

        uint256 sessionId = sessionCounter;
        uint256 newProposalId = ++proposalCounter;
        Proposal storage proposal = proposals[newProposalId];
        uint256 submittedCount = sessionSubmittedCounts[sessionId];

        for (uint256 i = 0; i < submittedCount; i++) {
            uint256 proposalIdInSession = sessionSubmittedProposals[sessionId][
                i
            ];
            if (
                proposalIdInSession != newProposalId &&
                proposals[proposalIdInSession].status == Status.Submitted
            ) {
                proposals[proposalIdInSession].status = Status.Archived;
            }
        }

        proposal.id = newProposalId;
        proposal.title = _newTitle;
        proposal.description = _newDescription;
        proposal.choices = _newChoices;
        proposal.creator = msg.sender;
        proposal.status = Status.Created;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_DURATION;
        proposal.sessionId = sessionId;
        proposal.referenceId = referenceId;

        activeProposalId = newProposalId;

        // update existing session
        sessions[sessionId] = Session({
            sessionId: sessionId,
            selectedProposalId: newProposalId,
            sessionTime: proposal.endTime
        });

        emit SessionClosed(
            sessionId,
            newProposalId,
            referenceId != 0 ? referenceId : 0,
            getStatusString(Status.Archived)
        );

        emit ProposalCreated(
            msg.sender,
            newProposalId,
            sessionId,
            proposal.referenceId,
            _newTitle,
            _newDescription,
            getStatusString(Status.Created),
            proposal.startTime,
            proposal.endTime,
            _newChoices
        );
    }

    function getTierWeight(address voter) internal view returns (uint256) {
        Tier tier = getTier(voter);
        if (tier == Tier.VIP) {
            return 4;
        } else if (tier == Tier.Gold) {
            return 3;
        } else if (tier == Tier.Silver) {
            return 2;
        } else if (tier == Tier.Bronze) {
            return 1;
        }
        return 0;
    }

    function vote(
        uint256 _proposalId,
        uint256 _choiceIndex
    ) external whenNotPaused nonReentrant {
        if (withRulesVoteConfig) {
            require(withRulesVote(msg.sender), "You are not eligible to vote");
        } else {
            require(
                noRulesPermission(msg.sender, noRulesVote),
                "You are not eligible to vote"
            );
        }

        uint256 currentSessionId = sessionCounter;
        // Session expiry check
        require(
            block.timestamp <= sessions[currentSessionId].sessionTime,
            "Session has expired"
        );
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(proposal.status == Status.Created, "Not active");
        require(_choiceIndex < proposal.choices.length, "Invalid choice");

        // Ensure the voter hasn't already voted on this proposal
        require(
            proposalVoteDetails[_proposalId][msg.sender].voter == address(0),
            "Already voted"
        );

        uint256 calculatedWeight;

        if (voteMethod == VoteMethod.TierPoint) {
            // If voting method is TierPoint, calculate weight based on user tier
            uint256 tierWeight = getTierWeight(msg.sender);
            calculatedWeight = tierWeight;
        } else if (voteMethod == VoteMethod.HoldingPercentage) {
            // If voting method is HoldingPercentage, calculate weight based on token holding percentage
            uint256 tokenHoldingPercentage = calculateVotePercentage(
                msg.sender
            );
            calculatedWeight = tokenHoldingPercentage;
        } else if (voteMethod == VoteMethod.CappedHoldingPercentage) {
            // If voting method is CappedHoldingPercentage, calculate weight with max cap
            uint256 tokenHoldingPercentage = cappedPercentage(msg.sender);
            uint256 cappedWeight = tokenHoldingPercentage >
                MAX_CAPPED_PERCENTAGE
                ? MAX_CAPPED_PERCENTAGE
                : tokenHoldingPercentage;
            calculatedWeight = cappedWeight;
        }

        // Update the votes for the specific choice
        finalizedVotes[_proposalId][_choiceIndex] += calculatedWeight;

        // Store the vote details for the voter
        proposalVoteDetails[_proposalId][msg.sender] = VoteDetail({
            proposalId: _proposalId,
            choiceIndex: _choiceIndex,
            voter: msg.sender,
            weight: calculatedWeight,
            method: voteMethod
        });

        emit Voted(
            _proposalId,
            msg.sender,
            _choiceIndex,
            calculatedWeight,
            voteMethod
        );
    }

    function cancelProposal(uint256 _proposalId) external onlyAdmin {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == Status.Created, "Proposal is not active");

        if (proposal.referenceId != 0) {
            Proposal storage proposalReference = proposals[
                proposal.referenceId
            ];
            proposalReference.status = Status.Failed;
        }

        if (activeProposalId == _proposalId) {
            activeProposalId = 0;
        }

        proposal.status = Status.Cancelled;
        proposal.endTime = block.timestamp;

        sessionCounter++;
        uint256 currentSessionId = sessionCounter;
        sessions[currentSessionId].sessionTime =
            block.timestamp +
            VOTING_DURATION;
        sessionSubmittedCounts[currentSessionId] = 0;
        sessions[currentSessionId].selectedProposalId = 0;
        emit ProposalCancelled(_proposalId, proposal.referenceId);
    }

    function updateProposalStatus(
        uint256 _proposalId,
        Status _status
    ) external onlyAdmin {
        Proposal storage proposal = proposals[_proposalId];
        require(
            _status == Status.Passed ||
                _status == Status.Failed ||
                _status == Status.Applied,
            "Invalid status update"
        );
        proposal.status = _status;

        if (activeProposalId == _proposalId) {
            activeProposalId = 0;
        }

        emit ProposalStatusUpdated(_proposalId, _status);
    }

    function updateVotingDuration(uint256 _days) external onlyAdmin {
        require(_days >= 1, "Voting duration too short");
        VOTING_DURATION = _days * 1 days;
    }

    function setVoteMethod(VoteMethod _method) external onlyAdmin {
        require(
            block.timestamp > proposals[activeProposalId].endTime,
            "Cannot change vote method while an active proposal is ongoing"
        );
        voteMethod = _method;
    }

    function pauseDAO(bool _pause) external onlyAdmin {
        daoPaused = _pause;
        emit DAOStatusUpdated(_pause);
    }

    function getProposalVote(
        uint256 _proposalId,
        uint256 _choiceIndex
    ) external view returns (uint256) {
        return finalizedVotes[_proposalId][_choiceIndex];
    }

    function getFinalizedVotes(
        uint256 _proposalId
    ) external view returns (uint256[] memory) {
        uint256 choiceCount = proposals[_proposalId].choices.length;
        uint256[] memory votes = new uint256[](choiceCount);

        for (uint256 i = 0; i < choiceCount; i++) {
            votes[i] = finalizedVotes[_proposalId][i];
        }

        return votes;
    }

    function getWinningChoice(
        uint256 _proposalId
    )
        external
        view
        returns (uint256 winningChoiceIndex, uint256 winningWeight)
    {
        Proposal storage proposal = proposals[_proposalId];
        uint256 choiceCount = proposal.choices.length;

        uint256 highestVote = 0;
        uint256 winningChoice = 0;

        for (uint256 i = 0; i < choiceCount; i++) {
            uint256 currentChoiceVote = finalizedVotes[_proposalId][i];
            if (currentChoiceVote > highestVote) {
                highestVote = currentChoiceVote;
                winningChoice = i;
            }
        }

        return (winningChoice, highestVote);
    }

    function getActiveProposal() external view returns (Proposal memory) {
        uint256 currentSessionId = sessionCounter;
        if (
            sessions[currentSessionId].sessionTime > 0 &&
            block.timestamp > sessions[currentSessionId].sessionTime
        ) {
            return proposals[0];
        }
        return proposals[sessions[currentSessionId].selectedProposalId];
    }
}
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceDAO", function () {
  let deployer, s1, s2;
  let dpToken, dao, stable;

  before(async function () {
    [deployer, s1, s2] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    stable = await StableStaking.deploy(
      dpToken.target,
      deployer.address,
      dpToken.target,
      deployer.address,
      deployer.address
    );
    await stable.waitForDeployment();
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    dao = await GovernanceDAO.deploy();
    await dao.waitForDeployment();
  });

  it("owner can add admin and update contract addresses", async function () {
    await expect(dao.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(dao, "AdminUpdated").withArgs(deployer.address, true);
    await expect(dao.connect(deployer).updateTokenLock(dpToken.target)).to.emit(dao, "ContractUpdated").withArgs("tokenLock", await dao.tokenLock(), dpToken.target);
    await expect(dao.connect(deployer).updateUsdtStake(stable.target)).to.emit(dao, "ContractUpdated").withArgs("usdtStake", await dao.usdtStake(), stable.target);
    await expect(dao.connect(deployer).updateUsdcStake(stable.target)).to.emit(dao, "ContractUpdated").withArgs("usdcStake", await dao.usdcStake(), stable.target);
  });

  it("computes tier from balance and locked", async function () {
    await dpToken.connect(deployer).transfer(s1.address, ethers.parseEther("100000"));
    const tierBefore = await dao.getTier(s1.address);
    expect(Number(tierBefore)).to.be.oneOf([0, 1]);
    await dpToken.connect(deployer).setStakingContract(deployer.address, true);
    await dpToken.connect(deployer).updateLockedAmount(s1.address, ethers.parseEther("2000000"), true);
    const tierAfter = await dao.getTier(s1.address);
    expect(Number(tierAfter)).to.equal(4);
  });

  it("reverts submitProposal when DAO paused", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateNoRulesProposalTier(0);
    await dao.connect(deployer).pauseDAO(true);
    await expect(
      dao.connect(deployer).submitProposal("t", "d", ["a", "b"])
    ).to.be.rejectedWith("DAO is paused");
    await dao.connect(deployer).pauseDAO(false);
  });

  it("updates rules configs and tiers, checks eligibility paths", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await expect(dao.connect(deployer).updateRulesVoteConfig(true)).to.emit(dao, "RulesVoteConfigUpdated").withArgs(true, deployer.address);
    await expect(dao.connect(deployer).updateRulesProposalConfig(true)).to.emit(dao, "RulesProposalConfigUpdated").withArgs(true, deployer.address);
    await expect(dao.connect(deployer).updateRulesVoteConfig(true)).to.be.rejectedWith("Config already set to this value");
    await expect(dao.connect(deployer).updateRulesProposalConfig(true)).to.be.rejectedWith("Config already set to this value");
    await expect(dao.connect(deployer).updateNoRulesVoteTier(1)).to.emit(dao, "NoRulesVoteTierUpdated");
    await expect(dao.connect(deployer).updateNoRulesProposalTier(3)).to.emit(dao, "NoRulesProposalTierUpdated");
    const canVote = await dao.checkEligibility(deployer.address, false);
    const canProp = await dao.checkEligibility(deployer.address, true);
    expect(typeof canVote).to.equal("boolean");
    expect(typeof canProp).to.equal("boolean");
  });

  it("createSession requires previous session expired", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    const tx = await dao.connect(deployer).createSession();
    const rc = await tx.wait();
    expect(rc.logs.length).to.be.greaterThan(0);
    await expect(dao.connect(deployer).createSession()).to.be.rejectedWith("Previous session is still active");
  });

  it("getWinningChoice returns highest finalized weight (TierPoint)", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateTokenLock(dpToken.target);
    await dao.connect(deployer).setVoteMethod(0);
    await dpToken.connect(deployer).transfer(s1.address, ethers.parseEther("200000")); // Bronze
    await dpToken.connect(deployer).transfer(s2.address, ethers.parseEther("1500000")); // Gold
    await dao.connect(deployer).updateRulesProposalConfig(false);
    await dao.connect(deployer).updateRulesVoteConfig(false);
    await dao.connect(deployer).updateNoRulesVoteTier(0);
    await dao.connect(deployer).updateNoRulesProposalTier(0);
    const prevActive = await dao.activeProposalId();
    if (prevActive !== 0n) {
      await dao.connect(deployer).cancelProposal(prevActive);
    }
    await dao.connect(deployer).submitProposal("t", "d", ["A", "B"]);
    const submittedId = await dao.proposalCounter();
    await dao.connect(deployer).selectProposal(submittedId, "t2", "d2", ["A", "B"]);
    const activeId = await dao.activeProposalId();
    await dao.connect(s1).vote(activeId, 0);
    await dao.connect(s2).vote(activeId, 1);
    const allVotes = await dao.getFinalizedVotes(activeId);
    const [winningIdx, winningWeight] = await dao.getWinningChoice(activeId);
    const expIndex = allVotes[0] > allVotes[1] ? 0 : 1;
    expect(Number(winningIdx)).to.equal(expIndex);
    expect(winningWeight).to.equal(allVotes[expIndex]);
  });

  it("setVoteMethod reverts while an active proposal is ongoing", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateNoRulesProposalTier(0);
    const prevActive = await dao.activeProposalId();
    if (prevActive !== 0n) {
      await dao.connect(deployer).cancelProposal(prevActive);
    }
    await dao.connect(deployer).submitProposal("t", "d", ["A", "B"]);
    const submittedId = await dao.proposalCounter();
    await dao.connect(deployer).selectProposal(submittedId, "t2", "d2", ["A", "B"]);
    await expect(dao.connect(deployer).setVoteMethod(1)).to.be.rejectedWith("Cannot change vote method while an active proposal is ongoing");
  });

  it("submitProposal auto-creates new session after expiry", async function () {
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateNoRulesProposalTier(0);
    const prevActive = await dao.activeProposalId();
    if (prevActive !== 0n) {
      await dao.connect(deployer).cancelProposal(prevActive);
    }
    await dao.connect(deployer).submitProposal("t", "d", ["A", "B"]);
    const submittedId = await dao.proposalCounter();
    await dao.connect(deployer).selectProposal(submittedId, "t2", "d2", ["A", "B"]);
    const prevSession = await dao.sessionCounter();
    await ethers.provider.send("evm_increaseTime", [11 * 60]);
    await ethers.provider.send("evm_mine");
    await dao.connect(deployer).submitProposal("t3", "d3", ["X", "Y"]);
    const newSession = await dao.sessionCounter();
    expect(newSession).to.equal(prevSession + 1n);
    const activeView = await dao.getActiveProposal();
    expect(activeView.id).to.equal(0n);
  });
});

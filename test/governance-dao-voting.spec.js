const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceDAO Voting Lifecycle", function () {
  let deployer, voter;
  let dpToken, stable, dao;

  before(async function () {
    [deployer, voter] = await ethers.getSigners();

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

    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateTokenLock(dpToken.target);
    await dao.connect(deployer).updateUsdtStake(stable.target);
    await dao.connect(deployer).updateUsdcStake(stable.target);
  });

  async function createActiveProposal() {
    const currentActive = await dao.activeProposalId();
    if (currentActive !== 0n) {
      await dao.connect(deployer).cancelProposal(currentActive);
    }
    const baseChoices = ["Yes", "No"];
    await dao.connect(deployer).updateNoRulesProposalTier(1);
    await dao.connect(voter).submitProposal("Title", "Desc", baseChoices);
    const submittedId = await dao.proposalCounter();
    await dao
      .connect(deployer)
      .selectProposal(submittedId, "NewTitle", "NewDesc", baseChoices);
    return await dao.activeProposalId();
  }

  it("finalizes weight using TierPoint method", async function () {
    await dao.connect(deployer).setVoteMethod(0);
    await dpToken.connect(deployer).transfer(voter.address, ethers.parseEther("100000"));
    const proposalId = await createActiveProposal();
    await dao.connect(voter).vote(proposalId, 0);
    const votes = await dao.getFinalizedVotes(proposalId);
    expect(votes[0]).to.equal(1n);
  });

  it("finalizes weight using HoldingPercentage method", async function () {
    const active = await dao.activeProposalId();
    if (active !== 0n) {
      await dao.connect(deployer).cancelProposal(active);
    }

    await dao.connect(deployer).setVoteMethod(1);
    const totalSupply = await dpToken.totalSupply();
    const amount = ethers.parseEther("200000");
    await dpToken.connect(deployer).transfer(voter.address, amount);

    const proposalId = await createActiveProposal();
    await dao.connect(voter).vote(proposalId, 1);

    const currentBalance = await dpToken.balanceOf(voter.address);
    const expected = (currentBalance * 1_000_000n) / totalSupply;
    const votes = await dao.getFinalizedVotes(proposalId);
    expect(votes[1]).to.equal(expected);
  });

  it("finalizes weight using CappedHoldingPercentage method with cap", async function () {
    const active = await dao.activeProposalId();
    if (active !== 0n) {
      await dao.connect(deployer).cancelProposal(active);
    }

    await dao.connect(deployer).setMaxPercentage(1000);
    await dao.connect(deployer).setVoteMethod(2);

    await dpToken.connect(deployer).transfer(voter.address, ethers.parseEther("10000000"));

    const proposalId = await createActiveProposal();
    await dao.connect(voter).vote(proposalId, 0);
    const votes = await dao.getFinalizedVotes(proposalId);
    expect(votes[0]).to.equal(1000n);
  });

  it("handles session transitions on cancel and new submissions", async function () {
    const proposalId = await createActiveProposal();
    const prevSession = await dao.sessionCounter();
    await dao.connect(deployer).cancelProposal(proposalId);
    const newSession = await dao.sessionCounter();
    expect(newSession).to.equal(prevSession + 1n);
    const currentSessionSelected = await (async () => {
      const activeView = await dao.getActiveProposal();
      return activeView.id;
    })();
    expect(currentSessionSelected).to.equal(0n);
    await dao.connect(deployer).submitProposal("Next", "Desc", ["A", "B"]);
    const submittedId = await dao.proposalCounter();
    expect(submittedId).to.be.greaterThan(0n);
  });

  it("enforces pause semantics for submit and vote", async function () {
    const proposalId = await createActiveProposal();
    await dao.connect(deployer).pauseDAO(true);
    await expect(
      dao.connect(deployer).submitProposal("Paused", "Desc", ["A", "B"])
    ).to.be.rejectedWith("DAO is paused");
    await expect(dao.connect(voter).vote(proposalId, 0)).to.be.rejectedWith("DAO is paused");
    await dao.connect(deployer).pauseDAO(false);
  });
});

const { ethers } = require("hardhat");

describe("Gas: GovernanceDAO", function () {
  let deployer, admin, dao, lock;

  before(async function () {
    [deployer, admin] = await ethers.getSigners();
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    dao = await GovernanceDAO.deploy();
    await dao.waitForDeployment();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    lock = await MockLock.deploy("LOCK", "LOCK", ethers.parseUnits("1000000", 18), deployer.address);
    await lock.waitForDeployment();
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateTokenLock(await lock.getAddress());
  });

  it("submit proposal and create active proposal", async function () {
    await dao.connect(deployer).pauseDAO(false);
    const choices = ["Yes", "No"];
    await dao.connect(deployer).submitProposal("Title", "Desc", choices);
    const submittedId = await dao.proposalCounter();
    await dao.connect(deployer).selectProposal(submittedId, "NewTitle", "NewDesc", choices);
  });

  it("vote using TierPoint and finalize weight", async function () {
    await dao.connect(deployer).pauseDAO(false);
    const prevActive = await dao.activeProposalId();
    if (prevActive !== 0n) {
      await dao.connect(deployer).cancelProposal(prevActive);
    }
    await dao.connect(deployer).updateNoRulesProposalTier(1);
    const choices = ["A", "B"];
    await dao.connect(deployer).submitProposal("P", "D", choices);
    const submittedId = await dao.proposalCounter();
    await dao.connect(deployer).selectProposal(submittedId, "P2", "D2", choices);
    const activeId = await dao.activeProposalId();
    await dao.connect(deployer).vote(activeId, 0);
    const w = await dao.getProposalVote(activeId, 0);
    if (w !== 3n) {
      throw new Error("unexpected weight");
    }
  });
});

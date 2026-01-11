const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceDAO Security", function () {
  let deployer, admin, user;
  let dao;

  before(async function () {
    [deployer, admin, user] = await ethers.getSigners();
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    dao = await GovernanceDAO.deploy();
    await dao.waitForDeployment();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const lock = await MockLock.deploy("LOCK", "LOCK", ethers.parseUnits("1000000", 18), deployer.address);
    await lock.waitForDeployment();
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateTokenLock(await lock.getAddress());
  });

  it("only owner can add admin", async function () {
    await expect(dao.connect(user).addOrRemoveAdmin(admin.address, true)).to.be.rejected;
    await expect(dao.connect(deployer).addOrRemoveAdmin(admin.address, true)).to.emit(dao, "AdminUpdated").withArgs(admin.address, true);
  });

  it("only admin can update tiers and pause; submit/vote blocked when paused", async function () {
    await expect(dao.connect(user).updateNoRulesProposalTier(0)).to.be.rejectedWith("Only the admin can perform this action.");
    await expect(dao.connect(admin).updateNoRulesProposalTier(0)).to.emit(dao, "NoRulesProposalTierUpdated");
    await expect(dao.connect(admin).updateNoRulesVoteTier(0)).to.emit(dao, "NoRulesVoteTierUpdated");
    const choices = ["A", "B"];
    await expect(dao.connect(user).submitProposal("t", "d", choices)).to.emit(dao, "ProposalSubmitted");
    await expect(dao.connect(admin).pauseDAO(true)).to.emit(dao, "DAOStatusUpdated").withArgs(true);
    await expect(dao.connect(user).submitProposal("t2", "d2", choices)).to.be.rejectedWith("DAO is paused");
    await expect(dao.connect(admin).pauseDAO(false)).to.emit(dao, "DAOStatusUpdated").withArgs(false);
  });

  it("vote blocked when paused and only admin can create active proposal", async function () {
    await expect(dao.connect(admin).selectProposal(0, "New", "Desc", ["X", "Y"])).to.emit(dao, "ProposalCreated");
    const active = await dao.activeProposalId();
    await expect(dao.connect(admin).pauseDAO(true)).to.emit(dao, "DAOStatusUpdated").withArgs(true);
    await expect(dao.connect(user).vote(active, 0)).to.be.rejectedWith("DAO is paused");
    await dao.connect(admin).pauseDAO(false);
  });
});

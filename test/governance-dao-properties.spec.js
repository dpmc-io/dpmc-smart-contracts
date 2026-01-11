const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceDAO Properties", function () {
  let deployer, a1, a2;
  let dpToken, dao;

  before(async function () {
    [deployer, a1, a2] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    dao = await GovernanceDAO.deploy();
    await dao.waitForDeployment();
    await dao.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await dao.connect(deployer).updateTokenLock(dpToken.target);
  });

  it("calculateVotePercentage is monotonic with holdings and cappedPercentage respects cap", async function () {
    const total = await dpToken.totalSupply();
    await dpToken.connect(deployer).transfer(a1.address, ethers.parseEther("100000"));
    await dpToken.connect(deployer).transfer(a2.address, ethers.parseEther("200000"));
    const p1 = await dao.calculateVotePercentage(a1.address);
    const p2 = await dao.calculateVotePercentage(a2.address);
    expect(p2).to.be.greaterThan(p1);
    await dao.connect(deployer).setMaxPercentage(2000);
    const c1 = await dao.cappedPercentage(a1.address);
    const c2 = await dao.cappedPercentage(a2.address);
    expect(c1).to.be.at.most(2000n);
    expect(c2).to.be.at.most(2000n);
    const expected1 = (await dpToken.balanceOf(a1.address)) * 1000000n / total;
    expect(p1).to.equal(expected1);
  });
});

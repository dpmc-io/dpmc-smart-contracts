const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("REDEEM Security", function () {
  let deployer, pool, user;
  let nfe, pay, redeem;

  before(async function () {
    [deployer, pool, user] = await ethers.getSigners();
    const MockNFE = await ethers.getContractFactory("MockNFE721");
    nfe = await MockNFE.deploy();
    await nfe.waitForDeployment();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    pay = await MockLock.deploy("Pay", "PAY", ethers.parseUnits("1000000", 18), pool.address);
    await pay.waitForDeployment();
    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();
    await redeem.connect(deployer).updateNFEaddress(await nfe.getAddress());
    await redeem.connect(deployer).updateDPMCaddress(await pay.getAddress());
    await redeem.connect(deployer).updatePayoutAddress(pool.address);
    await nfe.connect(deployer).mint(user.address, 1);
    await nfe.connect(deployer).setTokenValue(1, ethers.parseUnits("200", 18));
    await pay.connect(pool).approve(await redeem.getAddress(), ethers.parseUnits("1000000", 18));
  });

  it("only admin/owner can update addresses", async function () {
    await expect(redeem.connect(user).updateNFEaddress(user.address)).to.be.rejected;
    await expect(redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(redeem, "AddOrRemoveAdmin");
    await expect(redeem.connect(deployer).setIsRedeemable(true)).to.emit(redeem, "SetIsRedeemable");
  });

  it("redeem succeeds when approved and not blacklisted", async function () {
    await nfe.connect(user).setApprovalForAll(await redeem.getAddress(), true);
    await expect(redeem.connect(user).redeem(1)).to.emit(redeem, "Redeem");
  });

  it("blacklist prevents redeem", async function () {
    await redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await redeem.connect(deployer).updateBlacklistedAddress(user.address, true);
    await nfe.connect(deployer).mint(user.address, 2);
    await nfe.connect(deployer).setTokenValue(2, ethers.parseUnits("100", 18));
    await nfe.connect(user).setApprovalForAll(await redeem.getAddress(), true);
    await expect(redeem.connect(user).redeem(2)).to.be.rejected;
    await redeem.connect(deployer).updateBlacklistedAddress(user.address, false);
  });
});

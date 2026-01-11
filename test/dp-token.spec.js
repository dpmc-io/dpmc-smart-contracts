const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DPToken", function () {
  let deployer, other, staking, receiver, tax;
  let dpToken;

  before(async function () {
    [deployer, other, staking, receiver, tax] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(receiver.address, tax.address, 25000);
    await dpToken.waitForDeployment();
  });

  it("mints to receiver and sets buy tax", async function () {
    const dec = await dpToken.decimals();
    const bal = await dpToken.balanceOf(receiver.address);
    expect(dec).to.equal(18);
    expect(bal).to.equal(ethers.parseEther("100000000"));
  });

  it("only owner can set staking contract", async function () {
    await expect(dpToken.connect(other).setStakingContract(staking.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(dpToken.connect(receiver).setStakingContract(staking.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(dpToken.connect(deployer).setStakingContract(staking.address, true)).to.emit(dpToken, "StakingContractUpdated").withArgs(staking.address, true);
    const status = await dpToken.stakingContract(staking.address);
    expect(status).to.equal(true);
  });

  it("only staking contract can updateLockedAmount", async function () {
    await dpToken.connect(deployer).setStakingContract(staking.address, false);
    await expect(dpToken.connect(other).updateLockedAmount(other.address, 100n, true)).to.be.revertedWith("Not staking contract");
    await expect(dpToken.connect(staking).updateLockedAmount(other.address, 100n, true)).to.be.revertedWith("Not staking contract");
    await dpToken.connect(deployer).setStakingContract(staking.address, true);
    await expect(dpToken.connect(staking).updateLockedAmount(other.address, 100n, true))
      .to.emit(dpToken, "TokenLockedUpdated")
      .withArgs(other.address, 100n);
    const locked = await dpToken.tokenLocked(other.address);
    expect(locked).to.equal(100n);
    await expect(dpToken.connect(staking).updateLockedAmount(other.address, 50n, false))
      .to.emit(dpToken, "TokenLockedUpdated")
      .withArgs(other.address, 50n);
  });

  it("transferFrom enforces unlocked balance", async function () {
    await dpToken.connect(receiver).transfer(other.address, ethers.parseEther("1000"));
    const allowanceTx = await dpToken.connect(other).increaseAllowance(deployer.address, ethers.parseEther("1000"));
    await allowanceTx.wait();
    await dpToken.connect(deployer).setStakingContract(staking.address, true);
    await dpToken.connect(staking).updateLockedAmount(other.address, ethers.parseEther("900"), true);
    try {
      await dpToken.connect(deployer).transferFrom(other.address, tax.address, ethers.parseEther("950"));
      expect.fail("Expected revert");
    } catch (e) {
      expect(String(e)).to.include("Insufficient locked tokens");
    }
    await dpToken.connect(staking).updateLockedAmount(other.address, ethers.parseEther("400"), false);
    await expect(dpToken.connect(deployer).transferFrom(other.address, tax.address, ethers.parseEther("300"))).to.emit(dpToken, "Transfer");
  });

  it("reverts transfer when paused and sender not whitelisted (T3)", async function () {
    await dpToken.connect(receiver).transfer(other.address, ethers.parseEther("10"));
    await dpToken.connect(deployer).pause();
    try {
      await dpToken.connect(other).transfer(tax.address, ethers.parseEther("1"));
      expect.fail("Expected revert");
    } catch (e) {
      expect(String(e)).to.include("T3 - Transaction failed");
    }
    await dpToken.connect(deployer).unpause();
  });

  it("reverts transfer when paused and recipient not whitelisted (T4)", async function () {
    await dpToken.connect(deployer).pause();
    try {
      await dpToken.connect(receiver).transfer(other.address, ethers.parseEther("1"));
      expect.fail("Expected revert");
    } catch (e) {
      expect(String(e)).to.include("T4 - Transaction failed");
    }
    await dpToken.connect(deployer).unpause();
  });

  it("reverts transferFrom when paused and from not whitelisted (TF3)", async function () {
    await dpToken.connect(receiver).transfer(other.address, ethers.parseEther("5"));
    await dpToken.connect(other).increaseAllowance(deployer.address, ethers.parseEther("5"));
    await dpToken.connect(deployer).pause();
    try {
      await dpToken.connect(deployer).transferFrom(other.address, tax.address, ethers.parseEther("1"));
      expect.fail("Expected revert");
    } catch (e) {
      expect(String(e)).to.include("TF3 - Transaction failed");
    }
    await dpToken.connect(deployer).unpause();
  });

  it("reverts transferFrom when paused and recipient not whitelisted (TF4)", async function () {
    await dpToken.connect(receiver).increaseAllowance(deployer.address, ethers.parseEther("5"));
    await dpToken.connect(deployer).pause();
    try {
      await dpToken.connect(deployer).transferFrom(receiver.address, other.address, ethers.parseEther("1"));
      expect.fail("Expected revert");
    } catch (e) {
      expect(String(e)).to.include("TF4 - Transaction failed");
    }
    await dpToken.connect(deployer).unpause();
  });

  it("updates V4 manager/router/permit and emits events", async function () {
    await expect(dpToken.connect(deployer).updateV4PoolManager(deployer.address)).to.emit(dpToken, "V4PoolManagerUpdated").withArgs(deployer.address);
    await expect(dpToken.connect(deployer).updateV4Router(deployer.address)).to.emit(dpToken, "V4RouterUpdated").withArgs(deployer.address);
    await expect(dpToken.connect(deployer).updatePermit2(deployer.address)).to.emit(dpToken, "Permit2Updated").withArgs(deployer.address);
  });

  it("V4 buy path applies tax and emits debug", async function () {
    await expect(dpToken.connect(deployer).setDebug(true)).to.emit(dpToken, "DebugUpdated").withArgs(true);
    await expect(dpToken.connect(deployer).updateV4PoolManager(deployer.address)).to.emit(dpToken, "V4PoolManagerUpdated");
    await dpToken.connect(receiver).transfer(deployer.address, ethers.parseEther("100"));
    const balBeforeTax = await dpToken.balanceOf(deployer.address);
    const taxBefore = await dpToken.balanceOf(tax.address);
    const amount = ethers.parseEther("10");
    await expect(dpToken.connect(deployer).transfer(other.address, amount)).to.emit(dpToken, "UniswapDebug");
    const balAfterTax = await dpToken.balanceOf(deployer.address);
    const taxAfter = await dpToken.balanceOf(tax.address);
    expect(balAfterTax).to.be.lessThan(balBeforeTax);
    expect(taxAfter).to.be.greaterThan(taxBefore);
  });

  it("add/remove blacklist and whitelist with guards", async function () {
    await expect(dpToken.connect(deployer).addWhitelist(other.address)).to.emit(dpToken, "WhitelistUpdated").withArgs(other.address, true);
    await expect(dpToken.connect(deployer).removeFromWhitelist(other.address)).to.emit(dpToken, "WhitelistUpdated").withArgs(other.address, false);
    await expect(dpToken.connect(deployer).addBlacklist(other.address)).to.emit(dpToken, "BlacklistUpdated").withArgs(other.address, true);
    await expect(dpToken.connect(deployer).removeFromBlacklist(other.address)).to.emit(dpToken, "BlacklistUpdated").withArgs(other.address, false);
    await expect(dpToken.connect(deployer).updateTaxAddress(tax.address)).to.emit(dpToken, "TaxAddressUpdated").withArgs(tax.address);
    await expect(dpToken.connect(deployer).updateBuyTaxPercentage(50000)).to.emit(dpToken, "BuyTaxPercentageUpdated").withArgs(50000);
    await expect(dpToken.connect(deployer).updateBuyTaxPercentage(2000000)).to.be.rejectedWith("Tax percentage must be 1000000 (100%) or less");
  });
});

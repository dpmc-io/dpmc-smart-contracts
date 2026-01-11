const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DPToken Security", function () {
  let deployer, other, third;
  let token;

  before(async function () {
    [deployer, other, third] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    token = await DPToken.deploy(deployer.address, other.address, 100000);
    await token.waitForDeployment();
  });

  it("only owner can pause and unpause", async function () {
    await expect(token.connect(other).pause()).to.be.rejected;
    await expect(token.connect(deployer).pause()).to.emit(token, "Paused");
    await expect(token.connect(deployer).unpause()).to.emit(token, "Unpaused");
  });

  it("transfers blocked by pause for non-whitelisted recipient", async function () {
    await token.connect(deployer).pause();
    const balance = await token.balanceOf(deployer.address);
    await expect(token.connect(deployer).transfer(third.address, balance)).to.be.rejectedWith("T4 - Transaction failed: The recipient's address is not whitelisted, and the contract is currently paused.");
    await token.connect(deployer).addWhitelist(third.address);
    await expect(token.connect(deployer).transfer(third.address, balance)).to.emit(token, "Transfer");
    await token.connect(deployer).unpause();
  });

  it("blacklist prevents transfers", async function () {
    await token.connect(deployer).removeFromWhitelist(third.address);
    await token.connect(deployer).addBlacklist(third.address);
    await expect(token.connect(third).transfer(deployer.address, 1)).to.be.rejectedWith("T1 - Error: Sender's address is blacklisted and cannot initiate transactions.");
    await token.connect(deployer).removeFromBlacklist(third.address);
  });

  it("updateTaxAddress onlyOwner and non-zero", async function () {
    await expect(token.connect(other).updateTaxAddress(deployer.address)).to.be.rejected;
    await expect(token.connect(deployer).updateTaxAddress(ethers.ZeroAddress)).to.be.rejectedWith("Tax address cannot be zero");
    await expect(token.connect(deployer).updateTaxAddress(third.address)).to.emit(token, "TaxAddressUpdated").withArgs(third.address);
  });

  it("updateBuyTaxPercentage enforces max", async function () {
    await expect(token.connect(deployer).updateBuyTaxPercentage(1000001)).to.be.rejectedWith("Tax percentage must be 1000000 (100%) or less");
    await expect(token.connect(deployer).updateBuyTaxPercentage(500000)).to.emit(token, "BuyTaxPercentageUpdated").withArgs(500000);
  });
});

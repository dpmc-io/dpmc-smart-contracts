const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STAKE Security", function () {
  let deployer, user, reward;
  let nfe, erc20, stake;

  before(async function () {
    [deployer, user, reward] = await ethers.getSigners();
    const MockNFE = await ethers.getContractFactory("MockNFE721");
    nfe = await MockNFE.deploy();
    await nfe.waitForDeployment();
    await nfe.connect(deployer).mint(user.address, 1);
    await nfe.connect(deployer).setTokenValue(1, ethers.parseUnits("200", 18));
    const MockLock = await ethers.getContractFactory("MockLockToken");
    erc20 = await MockLock.deploy("Pay","PAY",ethers.parseUnits("1000000",18), reward.address);
    await erc20.waitForDeployment();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await stake.connect(deployer).updateNFEaddress(await nfe.getAddress());
    await stake.connect(deployer).updateDPMCaddress(await erc20.getAddress());
    await stake.connect(deployer).updateRewardAddress(reward.address);
    await stake.connect(deployer).updateSignerAddress(deployer.address);
    await nfe.connect(user).setApprovalForAll(await stake.getAddress(), true);
  });

  it("only admin can update settings", async function () {
    await expect(stake.connect(user).updateRestrictedReStaking(1)).to.be.rejectedWith("Only the admin can perform this action.");
    await expect(stake.connect(deployer).updateRestrictedReStaking(1)).to.emit(stake, "RestrictedReStakingUpdated").withArgs(1);
  });

  it("staking rejects expired signature and invalid signer", async function () {
    const period = 6;
    const rate = ethers.parseEther("1");
    const expBad = Math.floor(Date.now() / 1000) - 10;
    const hBad = ethers.solidityPackedKeccak256(["address","uint256","uint8","uint256","uint256"], [user.address, 1, period, rate, expBad]);
    const walletBad = ethers.Wallet.createRandom();
    const sigBad = ethers.Signature.from(new ethers.SigningKey(walletBad.privateKey).sign(hBad)).serialized;
    await expect(stake.connect(user).staking(1, period, rate, expBad, sigBad)).to.be.rejectedWith("Signature is expired.");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fake = ethers.Wallet.createRandom();
    const h = ethers.solidityPackedKeccak256(["address","uint256","uint8","uint256","uint256"], [user.address, 1, period, rate, exp]);
    const sigInvalid = ethers.Signature.from(new ethers.SigningKey(fake.privateKey).sign(h)).serialized;
    await expect(stake.connect(user).staking(1, period, rate, exp, sigInvalid)).to.be.rejectedWith("US1: Invalid signer");
  });

  it("blacklist prevents staking", async function () {
    await stake.connect(deployer).updateBlacklistedAddress(user.address, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const h = ethers.solidityPackedKeccak256(["address","uint256","uint8","uint256","uint256"], [user.address, 1, period, rate, exp]);
    const wallet = ethers.Wallet.createRandom();
    const sig = ethers.Signature.from(new ethers.SigningKey(wallet.privateKey).sign(h)).serialized;
    await expect(stake.connect(user).staking(1, period, rate, exp, sig)).to.be.rejectedWith("ST1: User address is blacklisted");
    await stake.connect(deployer).updateBlacklistedAddress(user.address, false);
  });
});

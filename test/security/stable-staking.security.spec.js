const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StableStaking Security", function () {
  let deployer, pool, locker, user;
  let stakingToken, lockingToken, staking;

  before(async function () {
    [deployer, pool, locker, user] = await ethers.getSigners();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    stakingToken = await MockLock.deploy("USDT", "USDT", ethers.parseUnits("1000000", 6), pool.address);
    await stakingToken.waitForDeployment();
    lockingToken = await MockLock.deploy("LOCK", "LOCK", ethers.parseUnits("1000000", 18), locker.address);
    await lockingToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    staking = await StableStaking.deploy(await stakingToken.getAddress(), pool.address, await lockingToken.getAddress(), locker.address, deployer.address);
    await staking.waitForDeployment();
  });

  it("only owner can add admin; only admin can pause/unpause", async function () {
    await expect(staking.connect(user).addOrRemoveAdmin(pool.address, true)).to.be.rejected;
    await expect(staking.connect(deployer).addOrRemoveAdmin(pool.address, true)).to.emit(staking, "AdminUpdated").withArgs(pool.address, true);
    await expect(staking.connect(user).pause()).to.be.rejectedWith("Admin only");
    await expect(staking.connect(pool).pause()).to.emit(staking, "ContractStateChanged");
    await expect(staking.connect(pool).unpause()).to.emit(staking, "ContractStateChanged");
  });

  it("stake rejects expired and invalid signer", async function () {
    const expBad = Math.floor(Date.now() / 1000) - 10;
    const msgBad = ethers.solidityPackedKeccak256(["address","address","uint8","uint256","uint256","bool","uint256"], [await staking.getAddress(), user.address, 0, 6, ethers.parseUnits("1000", 6), false, expBad]);
    const fakeForExpired = ethers.Wallet.createRandom();
    const sigBad = ethers.Signature.from(new ethers.SigningKey(fakeForExpired.privateKey).sign(msgBad)).serialized;
    await expect(staking.connect(user).stake(0, 6, ethers.parseUnits("1000", 6), false, expBad, sigBad)).to.be.rejectedWith("Signature expired.");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fake = ethers.Wallet.createRandom();
    const msg = ethers.solidityPackedKeccak256(["address","address","uint8","uint256","uint256","bool","uint256"], [await staking.getAddress(), user.address, 0, 6, ethers.parseUnits("1000", 6), false, exp]);
    const sigInvalid = ethers.Signature.from(new ethers.SigningKey(fake.privateKey).sign(msg)).serialized;
    await expect(staking.connect(user).stake(0, 6, ethers.parseUnits("1000", 6), false, exp, sigInvalid)).to.be.rejectedWith("Invalid signer.");
  });
});

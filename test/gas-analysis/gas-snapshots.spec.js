const { expect } = require("chai");
const { ethers } = require("hardhat");
const isCoverage = !!process.env.SOLIDITY_COVERAGE || process.env.npm_lifecycle_event === "coverage";

(isCoverage ? describe.skip : describe)("Gas Snapshots", function () {
  let deployer, pool, lockPool, user;
  let dpToken, lockingToken, staking, sigWallet;

  before(async function () {
    [deployer, pool, lockPool, user] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    lockingToken = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), lockPool.address);
    await lockingToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    sigWallet = ethers.Wallet.createRandom();
    staking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      lockingToken.target,
      lockPool.address,
      sigWallet.address
    );
    await staking.waitForDeployment();
    await staking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    await dpToken.connect(deployer).setStakingContract(staking.target, true);
    await staking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("5000000", 6));
    await dpToken.connect(deployer).transfer(user.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(user).increaseAllowance(staking.target, ethers.parseUnits("100000", 18));
    await lockingToken.connect(lockPool).transfer(user.address, ethers.parseUnits("10", 18));
    await lockingToken.connect(user).approve(staking.target, ethers.parseUnits("10", 18));
  });

  it("stake gas under threshold", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 600;
    const h = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, user.address, 0, period, amount, true, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(h)).serialized;
    const gas = await staking.connect(user).stake.estimateGas(0, period, amount, true, exp, sig);
    const threshold = 800000n;
    expect(gas).to.be.lessThan(threshold);
  });
});

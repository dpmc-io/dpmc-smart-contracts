const { ethers } = require("hardhat");

describe("Gas: StableStaking", function () {
  let deployer, pool, lockPool, signer, usdt, dpToken, stable;

  before(async function () {
    [deployer, pool, lockPool, signer] = await ethers.getSigners();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    usdt = await MockLock.deploy("USDT", "USDT", ethers.parseUnits("100000000", 6), pool.address);
    await usdt.waitForDeployment();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, pool.address, 100000);
    await dpToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    stable = await StableStaking.deploy(await usdt.getAddress(), pool.address, dpToken.target, lockPool.address, signer.address);
    await stable.waitForDeployment();
    await stable.connect(deployer).addOrRemoveAdmin(pool.address, true);
  });

  it("admin setters and tier threshold updates", async function () {
    await stable.connect(deployer).updateTotalMaxStakingPool(ethers.parseUnits("1000000", 6));
    await stable.connect(deployer).updateMaxStakeForTier(0, ethers.parseUnits("10000", 6));
    await stable.connect(deployer).updateAdditionalInterestForTier(0, 100000);
    await stable.connect(deployer).updateStakingToken(await usdt.getAddress());
    await stable.connect(deployer).updateLockingToken(dpToken.target);
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StableStaking Properties", function () {
  let deployer, pool, lockPool, userA, userB;
  let stakingToken, lockingToken, staking;

  before(async function () {
    [deployer, pool, lockPool, userA, userB] = await ethers.getSigners();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    stakingToken = await MockLock.deploy("USDT", "USDT", ethers.parseUnits("1000000", 6), pool.address);
    await stakingToken.waitForDeployment();
    lockingToken = await MockLock.deploy("LOCK", "LOCK", ethers.parseUnits("1000000", 18), lockPool.address);
    await lockingToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    staking = await StableStaking.deploy(await stakingToken.getAddress(), pool.address, await lockingToken.getAddress(), lockPool.address, deployer.address);
    await staking.waitForDeployment();
    await staking.connect(deployer).addOrRemoveAdmin(pool.address, true);
  });

  it("tier transitions are monotonic with increasing locked balance", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("1", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("2", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("3", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("4", 18));
    for (let i = 0; i <= 5; i++) {
      const amt = ethers.parseUnits(String(i), 18);
      const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
      await lockingToken.connect(lockPool).transfer(fresh.address, amt);
      const info = await staking.getUserStakeInfo(fresh.address, 0);
      const tierName = info.tierName;
      const order = ["Notier", "NoTier", "Bronze", "Silver", "Gold", "VIP"];
      expect(order.includes(tierName)).to.equal(true);
      if (i === 0) expect(["Notier", "NoTier"].includes(tierName)).to.equal(true);
      if (i === 1) expect(tierName).to.equal("Bronze");
      if (i === 2) expect(tierName).to.equal("Silver");
      if (i === 3) expect(tierName).to.equal("Gold");
      if (i >= 4) expect(tierName).to.equal("Gold");
    }
  });

  it("additional interest bounds across random valid values", async function () {
    const Tier = { Bronze: 1 };
    for (let ppm of [10000, 25000, 50000, 750000, 999999, 1000000]) {
      await staking.connect(pool).updateAdditionalInterestForTier(Tier.Bronze, ppm);
      const info = await staking.getUserStakeInfo(userB.address, 0);
      expect(info.eligibleAdditionalInterest).to.be.a("bigint");
    }
    await expect(staking.connect(pool).updateAdditionalInterestForTier(Tier.Bronze, 9999)).to.be.rejectedWith("Interest must be between 1% and 100%.");
    await expect(staking.connect(pool).updateAdditionalInterestForTier(Tier.Bronze, 1000001)).to.be.rejectedWith("Interest must be between 1% and 100%.");
  });
});

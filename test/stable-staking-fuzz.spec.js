const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fundWallet, approveERC20, buildStakeHash, buildWithdrawInterestHash, signHash } = require("./utils/helpers");

describe("StableStaking Fuzzing", function () {
  let deployer, pool, lockPool, signer, user;
  let dpToken, lockingToken, staking, sigWallet;

  before(async function () {
    [deployer, pool, lockPool, signer, user] = await ethers.getSigners();
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
    await approveERC20(dpToken, user, staking.target, ethers.parseUnits("100000", 18));
    await lockingToken.connect(lockPool).transfer(user.address, ethers.parseUnits("10", 18));
    await lockingToken.connect(user).approve(staking.target, ethers.parseUnits("10", 18));
  });

  it("stake expiry fuzzing around now", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const baseTs = (await ethers.provider.getBlock("latest")).timestamp;
    for (let delta of [-5, -1, 10, 60, 300]) {
      const exp = baseTs + delta;
      const h = buildStakeHash(staking.target, user.address, 0, period, amount, true, exp);
      const sig = signHash(sigWallet.privateKey, h);
      if (delta < 0) {
        await expect(staking.connect(user).stake(0, period, amount, true, exp, sig)).to.be.rejectedWith("Signature expired.");
      } else {
        await expect(staking.connect(user).stake(0, period, amount, true, exp, sig)).to.emit(staking, "Staked");
      }
    }
  });

  it("withdrawInterest arrays permutations and bounds", async function () {
    const period = 6;
    const amount = ethers.parseUnits("2000", 6);
    const baseTs = (await ethers.provider.getBlock("latest")).timestamp;
    const expS = baseTs + 600;
    const hS = buildStakeHash(staking.target, user.address, 0, period, amount, true, expS);
    const sigS = signHash(sigWallet.privateKey, hS);
    await expect(staking.connect(user).stake(0, period, amount, true, expS, sigS)).to.emit(staking, "Staked");
    const stakeId = await staking.currentStakeId();
    const info = await staking.stakes(user.address, stakeId);
    const monthly = info.meta.monthlyInterest;
    const limiter = info.meta.interestLimiter;
    const validMonths = [info.meta.stakingDate + 60n * 60n * 24n * 31n];
    const validInterests = [monthly];
    const expW = baseTs + 601;
    const hW = buildWithdrawInterestHash(staking.target, user.address, stakeId, validMonths, validInterests, expW);
    const sigW = signHash(sigWallet.privateKey, hW);
    await expect(staking.connect(user).withdrawInterest(stakeId, validMonths, validInterests, expW, sigW)).to.be.rejectedWith("Insufficient staking pool allowance");
    const tooHigh = [monthly + 1n];
    const hW2 = buildWithdrawInterestHash(staking.target, user.address, stakeId, validMonths, tooHigh, expW);
    const sigW2 = signHash(sigWallet.privateKey, hW2);
    await expect(staking.connect(user).withdrawInterest(stakeId, validMonths, tooHigh, expW, sigW2)).to.be.rejectedWith("Interest too high");
    const tooLow = [0];
    const hW3 = buildWithdrawInterestHash(staking.target, user.address, stakeId, validMonths, tooLow, expW);
    const sigW3 = signHash(sigWallet.privateKey, hW3);
    await expect(staking.connect(user).withdrawInterest(stakeId, validMonths, tooLow, expW, sigW3)).to.be.rejectedWith("Interest too low");
    const beyondLimiterMonth = info.meta.stakingDate + (info.meta.interestLimiter + 1n) * 60n * 60n * 24n * 31n;
    const monthsBad = [beyondLimiterMonth];
    const hW4 = buildWithdrawInterestHash(staking.target, user.address, stakeId, monthsBad, validInterests, expW);
    const sigW4 = signHash(sigWallet.privateKey, hW4);
    await expect(staking.connect(user).withdrawInterest(stakeId, monthsBad, validInterests, expW, sigW4)).to.be.rejectedWith("Month exceeds limiter");
  });

  it("tier boundary fuzz across lockMode true/false for stake validation", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("1", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("2", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("3", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("4", 18));
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await staking.connect(pool).updateLockMode(true);
    await staking.connect(pool).updateThreshold(Tier.NoTier, ethers.parseUnits("1", 18));
    for (let i = 0; i <= 4; i++) {
      const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
      await fundWallet(deployer, fresh.address, "1");
      await dpToken.connect(deployer).transfer(fresh.address, ethers.parseUnits("10000", 18));
      await approveERC20(dpToken, fresh, staking.target, ethers.parseUnits("10000", 18));
      await lockingToken.connect(lockPool).transfer(fresh.address, ethers.parseUnits(String(i), 18));
      await lockingToken.connect(fresh).approve(staking.target, ethers.parseUnits(String(i), 18));
      const baseTs = (await ethers.provider.getBlock("latest")).timestamp;
      const exp = baseTs + 600;
      const h = buildStakeHash(staking.target, fresh.address, 0, period, amount, true, exp);
      const sig = signHash(sigWallet.privateKey, h);
      if (i === 0) {
        await expect(staking.connect(fresh).stake(0, period, amount, true, exp, sig)).to.be.rejectedWith("Amount below minimum");
      } else {
        await expect(staking.connect(fresh).stake(0, period, amount, true, exp, sig)).to.emit(staking, "Staked");
      }
    }
    await staking.connect(pool).updateLockMode(false);
    const fresh2 = ethers.Wallet.createRandom().connect(ethers.provider);
    await fundWallet(deployer, fresh2.address, "1");
    await dpToken.connect(deployer).transfer(fresh2.address, ethers.parseUnits("10000", 18));
    await approveERC20(dpToken, fresh2, staking.target, ethers.parseUnits("10000", 18));
    const baseTs2 = (await ethers.provider.getBlock("latest")).timestamp;
    const exp2 = baseTs2 + 600;
    const h2 = buildStakeHash(staking.target, fresh2.address, 0, period, amount, false, exp2);
    const sig2 = signHash(sigWallet.privateKey, h2);
    await expect(staking.connect(fresh2).stake(0, period, amount, false, exp2, sig2)).to.emit(staking, "Staked");
  });
});

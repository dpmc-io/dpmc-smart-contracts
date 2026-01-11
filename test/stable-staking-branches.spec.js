const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StableStaking branch coverage", function () {
  let deployer, pool, lockPool, signer, other, other2;
  let dpToken, staking, sigWallet;

  before(async function () {
    [deployer, pool, lockPool, signer, other, other2] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    sigWallet = ethers.Wallet.createRandom();
    staking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      dpToken.target,
      lockPool.address,
      sigWallet.address
    );
    await staking.waitForDeployment();
    await staking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    await dpToken.connect(deployer).setStakingContract(staking.target, true);
    await staking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("5000000", 6));
    await dpToken.connect(deployer).transfer(pool.address, ethers.parseUnits("1000000", 18));
    await dpToken.connect(pool).increaseAllowance(staking.target, ethers.parseUnits("1000000", 18));
  });
  it("reverts stake with replayed signature (Signature used.)", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.emit(staking, "Staked");
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Signature used.");
  });

  it("reverts stake with expired signature", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const nowBlock = Number((await ethers.provider.getBlock("latest")).timestamp);
    const exp = nowBlock - 10;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Signature expired.");
  });

  it("reverts stake with invalid signer", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const fake = ethers.Wallet.createRandom();
    const sk = new ethers.SigningKey(fake.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Invalid signer.");
  });

  it("reverts stake with non-existent period (Invalid period)", async function () {
    const period = 24;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3700;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Invalid period");
  });

  it("reverts when pool exceeds max limit", async function () {
    await staking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("500", 6));
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3800;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Pool exceeds max limit");
    await staking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("5000000", 6));
  });

  it("reverts Personal stake too low", async function () {
    await staking.connect(pool).updatePersonalMinStake(ethers.parseUnits("1000000000", 6));
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3900;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Personal stake too low");
    await staking.connect(pool).updatePersonalMinStake(ethers.parseUnits("1000", 6));
  });

  it("reverts Institutional: min 12 months", async function () {
    const period = 6;
    const amount = ethers.parseUnits("60000", 6);
    const exp = Math.floor(Date.now() / 1000) + 4000;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 1, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(1, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Institutions: min 12 months");
  });

  it("withdrawInterest requires at least one month", async function () {
    const months = [];
    const interests = [];
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const msgHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, 1, months, interests, exp]
      )
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).withdrawInterest(1, months, interests, exp, sig)
    ).to.be.rejectedWith("Min 1 month required");
  });

  it("withdrawInterest rejects expired signature", async function () {
    const months = [1];
    const interests = [ethers.parseUnits("10", 18)];
    const exp = Math.floor(Date.now() / 1000) - 10;
    const msgHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, 1, months, interests, exp]
      )
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).withdrawInterest(1, months, interests, exp, sig)
    ).to.be.rejectedWith("Interest too high");
  });

  it("reverts stake count over max", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(deployer).transfer(other.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(other).increaseAllowance(staking.target, ethers.parseUnits("10000000", 6));
    for (let i = 0; i < 4; i++) {
      const exp = Math.floor(Date.now() / 1000) + 3600 + i;
      const msgHash = ethers.solidityPackedKeccak256(
        ["address","address","uint8","uint256","uint256","bool","uint256"],
        [staking.target, other.address, 0, period, amount, false, exp]
      );
      const sk = new ethers.SigningKey(sigWallet.privateKey);
      const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
      await expect(
        staking.connect(other).stake(0, period, amount, false, exp, sig)
      ).to.emit(staking, "Staked");
    }
    const expFail = Math.floor(Date.now() / 1000) + 3700;
    const msgHashFail = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, other.address, 0, period, amount, false, expFail]
    );
    const skFail = new ethers.SigningKey(sigWallet.privateKey);
    const sigFail = ethers.Signature.from(skFail.sign(msgHashFail)).serialized;
    await expect(
      staking.connect(other).stake(0, period, amount, false, expFail, sigFail)
    ).to.be.rejectedWith("Stake count over max");
  });

  it("reverts when exceeding tier max stake (Personal)", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("100000", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("500000", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("1000000", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("2000000", 18));
    await staking.connect(pool).updateMaxStakeForTier(Tier.NoTier, ethers.parseUnits("5000", 6));
    const period = 6;
    const first = ethers.parseUnits("4000", 6);
    const second = ethers.parseUnits("2000", 6);
    await dpToken.connect(deployer).transfer(other2.address, ethers.parseUnits("50000", 18));
    await dpToken.connect(other2).increaseAllowance(staking.target, ethers.parseUnits("10000000", 6));
    let exp = Math.floor(Date.now() / 1000) + 3800;
    let msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, other2.address, 0, period, first, false, exp]
    );
    let sk = new ethers.SigningKey(sigWallet.privateKey);
    let sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(other2).stake(0, period, first, false, exp, sig)
    ).to.emit(staking, "Staked");
    exp = Math.floor(Date.now() / 1000) + 3850;
    msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, other2.address, 0, period, second, false, exp]
    );
    sk = new ethers.SigningKey(sigWallet.privateKey);
    sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(other2).stake(0, period, second, false, exp, sig)
    ).to.be.rejectedWith("Exceeds max stake");
  });

  it("disable/enable staking period 6 toggles validity", async function () {
    await staking.connect(pool).disableStakingPeriod(6);
    const amount = ethers.parseUnits("1000", 6);
    const exp1 = Math.floor(Date.now() / 1000) + 4600;
    const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: fresh.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(fresh.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(fresh).increaseAllowance(staking.target, amount);
    const h1 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, 6, amount, false, exp1]
    );
    const s1 = new ethers.SigningKey(sigWallet.privateKey);
    const sig1 = ethers.Signature.from(s1.sign(h1)).serialized;
    await expect(
      staking.connect(fresh).stake(0, 6, amount, false, exp1, sig1)
    ).to.be.rejectedWith("Invalid period");
    await staking.connect(pool).enableStakingPeriod(6, 70000);
    const exp2 = Math.floor(Date.now() / 1000) + 4610;
    const h2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, 6, amount, false, exp2]
    );
    const s2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(s2.sign(h2)).serialized;
    await expect(
      staking.connect(fresh).stake(0, 6, amount, false, exp2, sig2)
    ).to.emit(staking, "Staked");
  });

  it("disable/enable staking period 18 toggles validity", async function () {
    await staking.connect(pool).disableStakingPeriod(18);
    const amount = ethers.parseUnits("2000", 6);
    const exp1 = Math.floor(Date.now() / 1000) + 4620;
    const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: fresh.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(fresh.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(fresh).increaseAllowance(staking.target, amount);
    const h1 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, 18, amount, false, exp1]
    );
    const s1 = new ethers.SigningKey(sigWallet.privateKey);
    const sig1 = ethers.Signature.from(s1.sign(h1)).serialized;
    await expect(
      staking.connect(fresh).stake(0, 18, amount, false, exp1, sig1)
    ).to.be.rejectedWith("Invalid period");
    await staking.connect(pool).enableStakingPeriod(18, 70000);
    const exp2 = Math.floor(Date.now() / 1000) + 4630;
    const h2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, 18, amount, false, exp2]
    );
    const s2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(s2.sign(h2)).serialized;
    await expect(
      staking.connect(fresh).stake(0, 18, amount, false, exp2, sig2)
    ).to.emit(staking, "Staked");
  });

  it("getUserStakeInfo reflects Bronze tier fields", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, 0);
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("500000", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("1000000", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("2000000", 18));
    const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: fresh.address, value: ethers.parseEther("1") });
    const info = await staking.getUserStakeInfo(fresh.address, 0);
    expect(info.tierName).to.equal("Bronze");
    expect(info.eligibleAdditionalInterest).to.equal(10000n);
    const maxBronze = await staking.maxStakeForTier(Tier.Bronze);
    const remaining = info.remainingStakingAllocation;
    expect(remaining).to.equal(maxBronze);
    const attempts = await staking.maxStakeAttempts();
    expect(info.remainingStakingTime).to.equal(attempts);
    const bal = await dpToken.balanceOf(fresh.address);
    expect(info.availableStakeBalance).to.equal(bal);
    expect(info.availableLockedBalance).to.equal(bal);
    expect(info.totalLockedTokens).to.equal(0n);
  });

  it("getUserStakeInfo reflects Silver and Gold tiers", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Silver, 0);
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("1000000", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("2000000", 18));
    const infoS = await staking.getUserStakeInfo(other.address, 0);
    expect(infoS.tierName).to.equal("Silver");
    const addS = await staking.additionalInterestForTier(Tier.Silver);
    expect(infoS.eligibleAdditionalInterest).to.equal(addS);
    await staking.connect(pool).updateThreshold(Tier.Gold, 0);
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("2000000", 18));
    const infoG = await staking.getUserStakeInfo(other.address, 0);
    expect(infoG.tierName).to.equal("Gold");
    const addG = await staking.additionalInterestForTier(Tier.Gold);
    expect(infoG.eligibleAdditionalInterest).to.equal(addG);
  });

  it("getUserStakeInfo personal VIP override shows Gold tier", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("100000", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("500000", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("1", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("3", 18));
    const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: fresh.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(fresh.address, ethers.parseUnits("3", 18));
    const infoP = await staking.getUserStakeInfo(fresh.address, 0);
    expect(infoP.tierName).to.equal("Gold");
    const addG = await staking.additionalInterestForTier(Tier.Gold);
    expect(infoP.eligibleAdditionalInterest).to.equal(addG);
  });

  it("getUserStakeInfo institutional VIP shows VIP tier", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.VIP, 0);
    const infoI = await staking.getUserStakeInfo(other.address, 1);
    expect(infoI.tierName).to.equal("VIP");
    const addV = await staking.additionalInterestForTier(Tier.VIP);
    expect(infoI.eligibleAdditionalInterest).to.equal(addV);
  });
  it("lock mode requires token lock", async function () {
    await staking.connect(pool).updateLockMode(true);
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 3900;
    await dpToken.connect(deployer).transfer(other2.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(other2).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, other2.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(other2).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("Token lock required");
    // reset lock mode to false for other tests
    await staking.connect(pool).updateLockMode(false);
  });

  it("admin setters revert on invalid inputs", async function () {
    await expect(staking.connect(pool).updateTotalMaxStakingPool(0)).to.be.rejectedWith("Max pool cannot be zero");
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await expect(staking.connect(pool).updateMaxStakeForTier(Tier.NoTier, 0)).to.be.rejectedWith("Max stake must be greater than 0");
    await expect(staking.connect(pool).updateAdditionalInterestForTier(Tier.NoTier, 9000)).to.be.rejectedWith("Interest must be between 1% and 100%.");
    await expect(staking.connect(pool).updateAdditionalInterestForTier(Tier.NoTier, 1000001)).to.be.rejectedWith("Interest must be between 1% and 100%.");
    await expect(staking.connect(pool).updateStakingToken(ethers.ZeroAddress)).to.be.rejectedWith("Invalid staking token address");
    await expect(staking.connect(pool).updateLockingToken(ethers.ZeroAddress)).to.be.rejectedWith("Invalid locking token address");
  });

  it("staking period admin methods guard rails", async function () {
    await expect(staking.connect(pool).addStakingPeriod(6, 70000, 6)).to.be.rejectedWith("Period is exist.");
    await expect(staking.connect(pool).updateStakingPeriod(24, 70000, 24)).to.be.rejectedWith("Period is not exist.");
    await expect(staking.connect(pool).updateStakingPeriod(6, 9000, 6)).to.be.rejectedWith("Interest rate must be at least 1%.");
    await expect(staking.connect(pool).enableStakingPeriod(24, 70000)).to.be.rejectedWith("Period is not exist.");
  });

  it("getAllTiers reports thresholds and interests", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("1", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("2", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("3", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("4", 18));
    const tiers = await staking.getAllTiers();
    expect(tiers.length).to.equal(5);
    const names = tiers.map(t => t.tier_name);
    expect(names).to.include.members(["NoTier", "Bronze", "Silver", "Gold", "VIP"]);
    const addV = await staking.additionalInterestForTier(4);
    expect(tiers[4].additional_interests).to.equal(addV);
  });

  it("periodList returns active periods and flags", async function () {
    const [periods, rates, totalActive, totalAmount, totalLocked, isActive] = await staking.periodList();
    expect(periods.length).to.equal(rates.length);
    expect(periods.length).to.equal(isActive.length);
    expect(periods).to.include.members([6n, 9n, 12n, 18n]);
    const idx6 = periods.indexOf(6n);
    expect(isActive[idx6]).to.equal(true);
  });

  it("disables and re-enables period 6 with event and flags", async function () {
    const [p0, , , , , a0] = await staking.periodList();
    const i6 = p0.indexOf(6n);
    expect(a0[i6]).to.equal(true);
    await expect(staking.connect(pool).disableStakingPeriod(6)).to.emit(staking, "StakingPeriodEvent");
    const [p1, , , , , a1] = await staking.periodList();
    const i61 = p1.indexOf(6n);
    expect(a1[i61]).to.equal(false);
    await expect(staking.connect(pool).enableStakingPeriod(6, 70000)).to.emit(staking, "StakingPeriodEvent");
    const [p2, , , , , a2] = await staking.periodList();
    const i62 = p2.indexOf(6n);
    expect(a2[i62]).to.equal(true);
  });

  it("disables and re-enables period 18 with event and flags", async function () {
    const [p0, , , , , a0] = await staking.periodList();
    const i18 = p0.indexOf(18n);
    expect(a0[i18]).to.equal(true);
    await expect(staking.connect(pool).disableStakingPeriod(18)).to.emit(staking, "StakingPeriodEvent");
    const [p1, , , , , a1] = await staking.periodList();
    const i181 = p1.indexOf(18n);
    expect(a1[i181]).to.equal(false);
    await expect(staking.connect(pool).enableStakingPeriod(18, 70000)).to.emit(staking, "StakingPeriodEvent");
    const [p2, , , , , a2] = await staking.periodList();
    const i182 = p2.indexOf(18n);
    expect(a2[i182]).to.equal(true);
  });

  it("updates bonding and withdrawal periods", async function () {
    await expect(staking.connect(pool).updateBondingPeriod(30)).to.emit(staking, "BondingPeriodUpdated");
    await expect(staking.connect(pool).updateWithdrawalPeriod(7)).to.emit(staking, "WithdrawalPeriodUpdated");
  });

  it("updates staking pool and locking pool addresses", async function () {
    const fresh = ethers.Wallet.createRandom();
    await expect(staking.connect(pool).updateStakingPoolAndReward(fresh.address)).to.emit(staking, "stakingPoolAndRewardUpdated");
    const fresh2 = ethers.Wallet.createRandom();
    await expect(staking.connect(pool).updateLockingPool(fresh2.address)).to.emit(staking, "lockedTokenUpdated");
    await staking.connect(pool).updateStakingPoolAndReward(pool.address);
    await staking.connect(pool).updateLockingPool(lockPool.address);
  });

  it("onlyValidAddress reverts on zero address for pools", async function () {
    await expect(staking.connect(pool).updateStakingPoolAndReward(ethers.ZeroAddress)).to.be.rejectedWith("Invalid address.");
    await expect(staking.connect(pool).updateLockingPool(ethers.ZeroAddress)).to.be.rejectedWith("Invalid address.");
  });

  it("getTierMinimumLocked returns thresholds for each tier", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    const minNo = await staking.getTierMinimumLocked(Tier.NoTier);
    const minBr = await staking.getTierMinimumLocked(Tier.Bronze);
    const minSi = await staking.getTierMinimumLocked(Tier.Silver);
    const minGo = await staking.getTierMinimumLocked(Tier.Gold);
    const minVi = await staking.getTierMinimumLocked(Tier.VIP);
    expect(minNo).to.be.a("bigint");
    expect(minBr).to.be.a("bigint");
    expect(minSi).to.be.a("bigint");
    expect(minGo).to.be.a("bigint");
    expect(minVi).to.be.a("bigint");
  });

  it("forceStop closes stake and emits event", async function () {
    const user3 = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: user3.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(user3.address, ethers.parseUnits("10000", 18));
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(user3).increaseAllowance(staking.target, amount);
    const period = 6;
    const exp = Math.floor(Date.now() / 1000) + 5000;
    const h = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, user3.address, 0, period, amount, false, exp]
    );
    const s = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(s.sign(h)).serialized;
    const tx = await staking.connect(user3).stake(0, period, amount, false, exp, sig);
    await tx.wait();
    const id = await staking.currentStakeId();
    await expect(staking.connect(pool).forceStop(id, user3.address)).to.emit(staking, "ForceStop");
  });

  it("computes monthly interest for Personal Bronze", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("100001", 18));
    await dpToken.connect(signer).increaseAllowance(staking.target, ethers.parseUnits("300000", 18));
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("100000", 18));
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("500000", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("1000000", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("2000000", 18));
    await staking.connect(pool).updateThreshold(Tier.Bronze, 0);
    const exp = Math.floor(Date.now() / 1000) + 4000;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, signer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(signer).stake(0, period, amount, false, exp, sig)
    ).to.emit(staking, "Staked");
    const id = await staking.currentStakeId();
    const info = await staking.stakes(signer.address, id);
    const base = info.meta.baseInterest;
    const addi = info.meta.additionalInterest;
    const monthly = info.meta.monthlyInterest;
    expect(base).to.equal(70000n);
    expect(addi).to.equal(10000n);
    const expected = (amount * (base + addi)) / 1000000n / 12n;
    expect(monthly).to.equal(expected);
  });

  it("computes monthly interest for Institutional Bronze", async function () {
    const period = 12;
    const amount = ethers.parseUnits("50000", 6);
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("100001", 18));
    await dpToken.connect(signer).increaseAllowance(staking.target, ethers.parseUnits("300000", 18));
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.VIP, 0);
    const exp = Math.floor(Date.now() / 1000) + 4100;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, signer.address, 1, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(signer).stake(1, period, amount, false, exp, sig)
    ).to.emit(staking, "Staked");
    const id = await staking.currentStakeId();
    const info = await staking.stakes(signer.address, id);
    const base = info.meta.baseInterest;
    const addi = info.meta.additionalInterest;
    const monthly = info.meta.monthlyInterest;
    expect(base).to.equal(70000n);
    expect(addi).to.equal(20000n);
    const expected = (amount * (base + addi)) / 1000000n / 12n;
    expect(monthly).to.equal(expected);
  });

  it("Personal VIP override applies Gold additional interest", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.VIP, 0);
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("1", 18));
    await dpToken.connect(signer).increaseAllowance(staking.target, ethers.parseUnits("1000000", 18));
    const exp = Math.floor(Date.now() / 1000) + 4200;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, signer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(signer).stake(0, period, amount, false, exp, sig)
    ).to.emit(staking, "Staked");
    const id = await staking.currentStakeId();
    const info = await staking.stakes(signer.address, id);
    expect(info.meta.additionalInterest).to.equal(20000n);
  });

  it("requestWithdrawPrincipal twice hits Already closed", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const expStake = Math.floor(Date.now() / 1000) + 4300;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, expStake]
    );
    const s1 = new ethers.SigningKey(sigWallet.privateKey);
    const sigStake = ethers.Signature.from(s1.sign(stakeHash)).serialized;
    await staking.connect(deployer).stake(0, period, amount, false, expStake, sigStake);
    const id = await staking.currentStakeId();
    const exp1 = Math.floor(Date.now() / 1000) + 4350;
    const reqHash1 = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, id, exp1]
    );
    const s2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig1 = ethers.Signature.from(s2.sign(reqHash1)).serialized;
    await expect(staking.connect(deployer).requestWithdrawPrincipal(id, exp1, sig1)).to.emit(staking, "WithdrawPrincipalRequested");
    const exp2 = Math.floor(Date.now() / 1000) + 4360;
    const reqHash2 = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, id, exp2]
    );
    const s3 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(s3.sign(reqHash2)).serialized;
    await expect(staking.connect(deployer).requestWithdrawPrincipal(id, exp2, sig2)).to.be.rejectedWith("Already closed");
  });

  it("withdrawPrincipal rejects not found and already claimed", async function () {
    const expNF = Math.floor(Date.now() / 1000) + 4400;
    const nfHash = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, 9999, expNF]
    );
    const skNF = new ethers.SigningKey(sigWallet.privateKey);
    const sigNF = ethers.Signature.from(skNF.sign(nfHash)).serialized;
    await expect(staking.connect(deployer).withdrawPrincipal(9999, expNF, sigNF)).to.be.rejectedWith("Staking not found.");
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const expStake = Math.floor(Date.now() / 1000) + 4410;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, expStake]
    );
    const skS = new ethers.SigningKey(sigWallet.privateKey);
    const sigS = ethers.Signature.from(skS.sign(stakeHash)).serialized;
    await staking.connect(deployer).stake(0, period, amount, false, expStake, sigS);
    const id = await staking.currentStakeId();
    const exp1 = Math.floor(Date.now() / 1000) + 4420;
    const reqHash = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, id, exp1]
    );
    const sk1 = new ethers.SigningKey(sigWallet.privateKey);
    const sig1 = ethers.Signature.from(sk1.sign(reqHash)).serialized;
    await staking.connect(deployer).requestWithdrawPrincipal(id, exp1, sig1);
    await dpToken.connect(pool).increaseAllowance(staking.target, ethers.parseUnits("100000000", 18));
    await dpToken.connect(lockPool).increaseAllowance(staking.target, ethers.parseUnits("100000000", 18));
    const expW = Math.floor(Date.now() / 1000) + 4430;
    const wHash = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, id, expW]
    );
    const skW = new ethers.SigningKey(sigWallet.privateKey);
    const sigW = ethers.Signature.from(skW.sign(wHash)).serialized;
    await expect(staking.connect(deployer).withdrawPrincipal(id, expW, sigW)).to.emit(staking, "WithdrawnPrincipal");
    const expW2 = Math.floor(Date.now() / 1000) + 4440;
    const wHash2 = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [staking.target, deployer.address, id, expW2]
    );
    const skW2 = new ethers.SigningKey(sigWallet.privateKey);
    const sigW2 = ethers.Signature.from(skW2.sign(wHash2)).serialized;
    await expect(staking.connect(deployer).withdrawPrincipal(id, expW2, sigW2)).to.be.rejectedWith("Already claimed");
  });

  it("withdrawInterest prevents month exceeds limiter and already withdrawn", async function () {
    const monthsBad = [Math.floor(Date.now() / 1000) + 100 * 365 * 24 * 3600];
    const interestsBad = [1n];
    const expBad = Math.floor(Date.now() / 1000) + 4500;
    const hashBad = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, 1, monthsBad, interestsBad, expBad]
      )
    );
    const skBad = new ethers.SigningKey(sigWallet.privateKey);
    const sigBad = ethers.Signature.from(skBad.sign(hashBad)).serialized;
    await expect(staking.connect(deployer).withdrawInterest(1, monthsBad, interestsBad, expBad, sigBad)).to.be.rejectedWith("Month exceeds limiter");
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    const expStake = Math.floor(Date.now() / 1000) + 4510;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, expStake]
    );
    const skS = new ethers.SigningKey(sigWallet.privateKey);
    const sigS = ethers.Signature.from(skS.sign(stakeHash)).serialized;
    await staking.connect(deployer).stake(0, period, amount, false, expStake, sigS);
    const id = await staking.currentStakeId();
    const month = Math.floor(Date.now() / 1000) + 1000;
    const interestsOk = [1n];
    const monthsOk = [month];
    const expOk = Math.floor(Date.now() / 1000) + 4520;
    const hashOk = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, id, monthsOk, interestsOk, expOk]
      )
    );
    const skOk = new ethers.SigningKey(sigWallet.privateKey);
    const sigOk = ethers.Signature.from(skOk.sign(hashOk)).serialized;
    await staking.connect(deployer).withdrawInterest(id, monthsOk, interestsOk, expOk, sigOk);
    const expDup = Math.floor(Date.now() / 1000) + 4530;
    const hashDup = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, id, monthsOk, interestsOk, expDup]
      )
    );
    const skDup = new ethers.SigningKey(sigWallet.privateKey);
    const sigDup = ethers.Signature.from(skDup.sign(hashDup)).serialized;
    await expect(staking.connect(deployer).withdrawInterest(id, monthsOk, interestsOk, expDup, sigDup)).to.be.rejectedWith("Already withdrawn");
  });

  it("stake fails when DPToken paused and staker not whitelisted", async function () {
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(deployer).pause();
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(signer).increaseAllowance(staking.target, ethers.parseUnits("10000000", 6));
    const exp = Math.floor(Date.now() / 1000) + 4600;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, signer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(signer).stake(0, period, amount, false, exp, sig)
    ).to.be.rejectedWith("TF3 - Transaction failed: The sender's address is not whitelisted, and the contract is currently paused.");
    await dpToken.connect(deployer).unpause();
  });

  it("withdrawInterest rejects interest too low across months", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(signer).increaseAllowance(staking.target, amount);
    const expStake = Math.floor(Date.now() / 1000) + 4700;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, signer.address, 0, period, amount, false, expStake]
    );
    const skS = new ethers.SigningKey(sigWallet.privateKey);
    const sigS = ethers.Signature.from(skS.sign(stakeHash)).serialized;
    await staking.connect(signer).stake(0, period, amount, false, expStake, sigS);
    const id = await staking.currentStakeId();
    await dpToken.connect(pool).increaseAllowance(staking.target, ethers.parseUnits("100000000", 18));
    const months = [Math.floor(Date.now() / 1000) + 1000, Math.floor(Date.now() / 1000) + 2000];
    const interests = [0n, 1n];
    const exp = Math.floor(Date.now() / 1000) + 4710;
    const wHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, signer.address, id, months, interests, exp]
      )
    );
    const skW = new ethers.SigningKey(sigWallet.privateKey);
    const sigW = ethers.Signature.from(skW.sign(wHash)).serialized;
    await expect(staking.connect(signer).withdrawInterest(id, months, interests, exp, sigW)).to.be.rejectedWith("Interest too low");
  });

  it("withdrawInterest rejects interest too high across months", async function () {
    const period = 6;
    const amount = ethers.parseUnits("1000", 6);
    await dpToken.connect(other2).increaseAllowance(staking.target, amount);
    const expStake = Math.floor(Date.now() / 1000) + 4720;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, other2.address, 0, period, amount, false, expStake]
    );
    const skS = new ethers.SigningKey(sigWallet.privateKey);
    const sigS = ethers.Signature.from(skS.sign(stakeHash)).serialized;
    await staking.connect(other2).stake(0, period, amount, false, expStake, sigS);
    const id = await staking.currentStakeId();
    const info = await staking.stakes(other2.address, id);
    await dpToken.connect(pool).increaseAllowance(staking.target, ethers.parseUnits("100000000", 18));
    const monthly = info.meta.monthlyInterest;
    const months = [Math.floor(Date.now() / 1000) + 1500];
    const interests = [monthly + 1n];
    const exp = Math.floor(Date.now() / 1000) + 4730;
    const wHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, other2.address, id, months, interests, exp]
      )
    );
    const skW = new ethers.SigningKey(sigWallet.privateKey);
    const sigW = ethers.Signature.from(skW.sign(wHash)).serialized;
    await expect(staking.connect(other2).withdrawInterest(id, months, interests, exp, sigW)).to.be.rejectedWith("Interest too high");
  });

  it("disables period then re-enables and stake succeeds", async function () {
    const period = 9;
    await expect(staking.connect(pool).disableStakingPeriod(period)).to.emit(staking, "StakingPeriodEvent");
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 4740;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(staking.connect(deployer).stake(0, period, amount, false, exp, sig)).to.be.rejectedWith("Invalid period");
    await expect(staking.connect(pool).enableStakingPeriod(period, 70000)).to.emit(staking, "StakingPeriodEvent");
    const exp2 = Math.floor(Date.now() / 1000) + 4750;
    const msgHash2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp2]
    );
    const sk2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(sk2.sign(msgHash2)).serialized;
    await expect(staking.connect(deployer).stake(0, period, amount, false, exp2, sig2)).to.emit(staking, "Staked");
  });

  it("disables period 6 then re-enables and stake succeeds", async function () {
    const period = 6;
    await expect(staking.connect(pool).disableStakingPeriod(period)).to.emit(staking, "StakingPeriodEvent");
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 4760;
    await dpToken.connect(deployer).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(staking.connect(deployer).stake(0, period, amount, false, exp, sig)).to.be.rejectedWith("Invalid period");
    await expect(staking.connect(pool).enableStakingPeriod(period, 70000)).to.emit(staking, "StakingPeriodEvent");
    const exp2 = Math.floor(Date.now() / 1000) + 4770;
    const msgHash2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, period, amount, false, exp2]
    );
    const sk2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(sk2.sign(msgHash2)).serialized;
    await expect(staking.connect(deployer).stake(0, period, amount, false, exp2, sig2)).to.emit(staking, "Staked");
  });

  it("disables period 18 then re-enables and stake succeeds", async function () {
    const period = 18;
    await expect(staking.connect(pool).disableStakingPeriod(period)).to.emit(staking, "StakingPeriodEvent");
    const amount = ethers.parseUnits("1000", 6);
    const exp = Math.floor(Date.now() / 1000) + 4780;
    const fresh = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: fresh.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(fresh.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(fresh).increaseAllowance(staking.target, amount);
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, period, amount, false, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(staking.connect(fresh).stake(0, period, amount, false, exp, sig)).to.be.rejectedWith("Invalid period");
    await expect(staking.connect(pool).enableStakingPeriod(period, 70000)).to.emit(staking, "StakingPeriodEvent");
    const exp2 = Math.floor(Date.now() / 1000) + 4790;
    const msgHash2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, fresh.address, 0, period, amount, false, exp2]
    );
    const sk2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(sk2.sign(msgHash2)).serialized;
    await expect(staking.connect(fresh).stake(0, period, amount, false, exp2, sig2)).to.emit(staking, "Staked");
  });

  it("principal withdrawal path with locked tokens using mock lock token", async function () {
    const amountStake = ethers.parseUnits("2000", 6);
    const amountLock = ethers.parseUnits("5000", 18);
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    await dpToken.connect(deployer).setStakingContract(newStaking.target, true);
    await newStaking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("5000000", 6));
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("100000", 18));
    await dpToken.connect(signer).increaseAllowance(newStaking.target, amountStake);
    await mlock.connect(deployer).transfer(signer.address, amountLock);
    await mlock.connect(signer).approve(newStaking.target, amountLock);
    const period = 6;
    const expStake = Math.floor(Date.now() / 1000) + 4800;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [newStaking.target, signer.address, 0, period, amountStake, true, expStake]
    );
    const skS = new ethers.SigningKey(sigWallet.privateKey);
    const sigS = ethers.Signature.from(skS.sign(stakeHash)).serialized;
    await expect(newStaking.connect(signer).stake(0, period, amountStake, true, expStake, sigS)).to.emit(newStaking, "Staked");
    const id = await newStaking.currentStakeId();
    const expReq = Math.floor(Date.now() / 1000) + 4810;
    const reqHash = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [newStaking.target, signer.address, id, expReq]
    );
    const skR = new ethers.SigningKey(sigWallet.privateKey);
    const sigR = ethers.Signature.from(skR.sign(reqHash)).serialized;
    await expect(newStaking.connect(signer).requestWithdrawPrincipal(id, expReq, sigR)).to.emit(newStaking, "WithdrawPrincipalRequested");
    await dpToken.connect(pool).increaseAllowance(newStaking.target, ethers.parseUnits("100000000", 18));
    await mlock.connect(lockPool).approve(newStaking.target, amountLock);
    const expW = Math.floor(Date.now() / 1000) + 4820;
    const wHash = ethers.solidityPackedKeccak256(
      ["address","address","uint256","uint256"],
      [newStaking.target, signer.address, id, expW]
    );
    const skW = new ethers.SigningKey(sigWallet.privateKey);
    const sigW = ethers.Signature.from(skW.sign(wHash)).serialized;
    await expect(newStaking.connect(signer).withdrawPrincipal(id, expW, sigW)).to.emit(newStaking, "WithdrawnPrincipal");
  });

  it("lock mode toggles and minimum lock amount path (mock lock)", async function () {
    const amountStake = ethers.parseUnits("1000", 6);
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    await newStaking.connect(pool).updateTotalMaxStakingPool(ethers.parseUnits("5000000", 6));
    await newStaking.connect(pool).updateLockMode(true);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await newStaking.connect(pool).updateThreshold(Tier.NoTier, ethers.parseUnits("1", 18));
    await dpToken.connect(deployer).transfer(signer.address, ethers.parseUnits("10000", 18));
    await dpToken.connect(signer).increaseAllowance(newStaking.target, amountStake);
    const period = 6;
    const expA = Math.floor(Date.now() / 1000) + 4900;
    const hA = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [newStaking.target, signer.address, 0, period, amountStake, false, expA]
    );
    const skA = new ethers.SigningKey(sigWallet.privateKey);
    const sigA = ethers.Signature.from(skA.sign(hA)).serialized;
    await expect(newStaking.connect(signer).stake(0, period, amountStake, false, expA, sigA)).to.be.rejectedWith("Token lock required");
    await mlock.connect(deployer).transfer(signer.address, ethers.parseUnits("2", 18));
    await mlock.connect(signer).approve(newStaking.target, ethers.parseUnits("2", 18));
    const expB = Math.floor(Date.now() / 1000) + 4910;
    const hB = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [newStaking.target, signer.address, 0, period, amountStake, true, expB]
    );
    const skB = new ethers.SigningKey(sigWallet.privateKey);
    const sigB = ethers.Signature.from(skB.sign(hB)).serialized;
    await expect(newStaking.connect(signer).stake(0, period, amountStake, true, expB, sigB)).to.emit(newStaking, "Staked");
    await newStaking.connect(pool).updateLockMode(false);
    await dpToken.connect(signer).increaseAllowance(newStaking.target, amountStake);
    const expC = Math.floor(Date.now() / 1000) + 4920;
    const hC = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [newStaking.target, signer.address, 0, period, amountStake, false, expC]
    );
    const skC = new ethers.SigningKey(sigWallet.privateKey);
    const sigC = ethers.Signature.from(skC.sign(hC)).serialized;
    await expect(newStaking.connect(signer).stake(0, period, amountStake, false, expC, sigC)).to.emit(newStaking, "Staked");
  });

  it("tier cap transitions: increase cap allows subsequent stake", async function () {
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await staking.connect(pool).updateThreshold(Tier.Bronze, 0);
    await staking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("5000000", 18));
    await staking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("10000000", 18));
    await staking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("20000000", 18));
    await staking.connect(pool).updateMaxStakeForTier(Tier.Bronze, ethers.parseUnits("5000", 6));
    const period = 6;
    const first = ethers.parseUnits("4000", 6);
    const second = ethers.parseUnits("2000", 6);
    const user4 = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: user4.address, value: ethers.parseEther("1") });
    await dpToken.connect(deployer).transfer(user4.address, ethers.parseUnits("50000", 18));
    await dpToken.connect(user4).increaseAllowance(staking.target, ethers.parseUnits("10000000", 6));
    let exp = Math.floor(Date.now() / 1000) + 4950;
    let h = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, user4.address, 0, period, first, false, exp]
    );
    let sk = new ethers.SigningKey(sigWallet.privateKey);
    let sig = ethers.Signature.from(sk.sign(h)).serialized;
    await expect(staking.connect(user4).stake(0, period, first, false, exp, sig)).to.emit(staking, "Staked");
    exp = Math.floor(Date.now() / 1000) + 4960;
    h = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, user4.address, 0, period, second, false, exp]
    );
    sk = new ethers.SigningKey(sigWallet.privateKey);
    sig = ethers.Signature.from(sk.sign(h)).serialized;
    await expect(staking.connect(user4).stake(0, period, second, false, exp, sig)).to.be.rejectedWith("Exceeds max stake");
    await staking.connect(pool).updateMaxStakeForTier(Tier.Bronze, ethers.parseUnits("10000", 6));
    const exp2 = Math.floor(Date.now() / 1000) + 4970;
    const h2 = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, user4.address, 0, period, second, false, exp2]
    );
    const sk2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(sk2.sign(h2)).serialized;
    await expect(staking.connect(user4).stake(0, period, second, false, exp2, sig2)).to.emit(staking, "Staked");
  });
  it("getUserStakeInfo reflects Bronze/Silver/Gold tiers for Personal", async function () {
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await newStaking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("1", 18));
    await newStaking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("2", 18));
    await newStaking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("3", 18));
    await mlock.connect(deployer).transfer(signer.address, ethers.parseUnits("3", 18));
    let info = await newStaking.getUserStakeInfo(signer.address, 0);
    expect(info.tierName).to.equal("Gold");
    expect(info.eligibleAdditionalInterest).to.equal(20000n);
    await mlock.connect(deployer).transfer(other.address, ethers.parseUnits("2", 18));
    info = await newStaking.getUserStakeInfo(other.address, 0);
    expect(info.tierName).to.equal("Silver");
    expect(info.eligibleAdditionalInterest).to.equal(15000n);
    await mlock.connect(deployer).transfer(other2.address, ethers.parseUnits("1", 18));
    info = await newStaking.getUserStakeInfo(other2.address, 0);
    expect(info.tierName).to.equal("Bronze");
    expect(info.eligibleAdditionalInterest).to.equal(10000n);
  });

  it("getUserStakeInfo reflects VIP tier for Institutional", async function () {
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await newStaking.connect(pool).updateThreshold(Tier.VIP, 1);
    await mlock.connect(deployer).transfer(signer.address, ethers.parseUnits("2", 18));
    const info = await newStaking.getUserStakeInfo(signer.address, 1);
    expect(info.tierName).to.equal("VIP");
    expect(info.eligibleAdditionalInterest).to.equal(20000n);
  });

  it("getUserStakeInfo reflects Gold tier for Personal at/above VIP threshold", async function () {
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await newStaking.connect(pool).updateThreshold(Tier.Bronze, ethers.parseUnits("1", 18));
    await newStaking.connect(pool).updateThreshold(Tier.Silver, ethers.parseUnits("2", 18));
    await newStaking.connect(pool).updateThreshold(Tier.Gold, ethers.parseUnits("3", 18));
    await newStaking.connect(pool).updateThreshold(Tier.VIP, ethers.parseUnits("4", 18));
    await newStaking.connect(pool).updateAdditionalInterestForTier(Tier.Gold, 16000);
    await mlock.connect(deployer).transfer(other.address, ethers.parseUnits("5", 18));
    const info = await newStaking.getUserStakeInfo(other.address, 0);
    expect(info.tierName).to.equal("Gold");
    expect(info.eligibleAdditionalInterest).to.equal(16000n);
  });

  it("getUserStakeInfo reflects NoTier when no locked tokens", async function () {
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mlock = await MockLock.deploy("MockLock", "MLK", ethers.parseUnits("1000000", 18), deployer.address);
    await mlock.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    const newStaking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      mlock.target,
      lockPool.address,
      sigWallet.address
    );
    await newStaking.waitForDeployment();
    await newStaking.connect(deployer).addOrRemoveAdmin(pool.address, true);
    const Tier = { NoTier: 0, Bronze: 1, Silver: 2, Gold: 3, VIP: 4 };
    await newStaking.connect(pool).updateThreshold(Tier.NoTier, 0);
    await newStaking.connect(pool).updateAdditionalInterestForTier(Tier.NoTier, 10000);
    const info = await newStaking.getUserStakeInfo(signer.address, 0);
    expect(info.tierName).to.equal("NoTier");
    expect(info.eligibleAdditionalInterest).to.equal(10000n);
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STAKE branch coverage", function () {
  let deployer, user, other, reward;
  let stake, dpToken, mockNfe, sigWallet;

  before(async function () {
    [deployer, user, other, reward] = await ethers.getSigners();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const MockNFE721 = await ethers.getContractFactory("MockNFE721");
    mockNfe = await MockNFE721.deploy();
    await mockNfe.waitForDeployment();
    await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await stake.connect(deployer).updateNFEaddress(mockNfe.target);
    await stake.connect(deployer).updateDPMCaddress(dpToken.target);
    await stake.connect(deployer).updateRewardAddress(reward.address);
    sigWallet = ethers.Wallet.createRandom();
    await stake.connect(deployer).updateSignerAddress(sigWallet.address);
    await mockNfe.connect(deployer).mint(user.address, 1);
    await mockNfe.connect(deployer).setTokenValue(1, ethers.parseEther("200"));
  });

  it("reverts stake with expired signature", async function () {
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) - 10;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("Signature is expired.");
  });

  it("reverts stake with invalid signer", async function () {
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const fake = ethers.Wallet.createRandom();
    const sk = new ethers.SigningKey(fake.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("US1: Invalid signer");
  });

  it("reverts when user address is blacklisted", async function () {
    await stake.connect(deployer).updateBlacklistedAddress(user.address, true);
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST1: User address is blacklisted");
    await stake.connect(deployer).updateBlacklistedAddress(user.address, false);
  });

  it("reverts when tokenId is blacklisted", async function () {
    await stake.connect(deployer).updateBlacklistedTokenId(1, true);
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST2: This tokenID is blacklisted");
    await stake.connect(deployer).updateBlacklistedTokenId(1, false);
  });

  it("reverts when not approved", async function () {
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST5: Contract must be approved");
  });

  it("reverts when not owner of token", async function () {
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [other.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(other).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST4: You do not own this token");
  });

  it("reverts when token value is below MIN_TOKEN_TO_STAKE", async function () {
    await stake.connect(deployer).updateMinStake(ethers.parseEther("300"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST6: erc721token value is lower than MIN_TOKEN_TO_STAKE");
    await stake.connect(deployer).updateMinStake(ethers.parseEther("100"));
  });

  it("reverts when staking pool limit exceeded", async function () {
    await mockNfe.connect(deployer).setTokenValue(1, ethers.parseEther("200"));
    await stake.connect(deployer).updateMaxStakingPool(ethers.parseEther("100"));
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("Staking pool limit exceeded.");
    await stake.connect(deployer).updateMaxStakingPool(0);
  });

  it("reverts with invalid staking period (APR zero)", async function () {
    const stakePeriod = 5; // APR[5] defaults to 0
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST0: Invalid staking period");
  });

  it("emits Staking and then rejects replayed signature", async function () {
    await stake.connect(deployer).updateAprPercentage(6, 100000);
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, stakePeriod, tokenRateUSDT, exp]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.emit(stake, "Staking");
    await expect(
      stake.connect(user).staking(1, stakePeriod, tokenRateUSDT, exp, sig)
    ).to.be.rejectedWith("ST4: You do not own this token");
  });

  it("staking fails when paused; blacklist toggles under unpaused", async function () {
    await mockNfe.connect(deployer).mint(user.address, 2);
    await mockNfe.connect(deployer).setTokenValue(2, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    await stake.connect(deployer).pause();
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp1 = Math.floor(Date.now() / 1000) + 3700;
    const h1 = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 2, period, rate, exp1]
    );
    const s1 = new ethers.SigningKey(sigWallet.privateKey);
    const sig1 = ethers.Signature.from(s1.sign(h1)).serialized;
    await expect(
      stake.connect(user).staking(2, period, rate, exp1, sig1)
    ).to.be.rejectedWith("Pausable: paused");
    await stake.connect(deployer).unpause();
    await stake.connect(deployer).updateBlacklistedAddress(user.address, true);
    const exp2 = Math.floor(Date.now() / 1000) + 3710;
    const h2 = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 2, period, rate, exp2]
    );
    const s2 = new ethers.SigningKey(sigWallet.privateKey);
    const sig2 = ethers.Signature.from(s2.sign(h2)).serialized;
    await expect(
      stake.connect(user).staking(2, period, rate, exp2, sig2)
    ).to.be.rejectedWith("ST1: User address is blacklisted");
    await stake.connect(deployer).updateBlacklistedAddress(user.address, false);
    const exp3 = Math.floor(Date.now() / 1000) + 3720;
    const h3 = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 2, period, rate, exp3]
    );
    const s3 = new ethers.SigningKey(sigWallet.privateKey);
    const sig3 = ethers.Signature.from(s3.sign(h3)).serialized;
    await expect(
      stake.connect(user).staking(2, period, rate, exp3, sig3)
    ).to.emit(stake, "Staking");
  });

  it("APR update boundaries: reject below 1% and accept at 1%", async function () {
    await expect(stake.connect(deployer).updateAprPercentage(6, 9000)).to.be.rejectedWith(
      "AV2: APR percentage should be greater than or equal to 1%"
    );
    await expect(stake.connect(deployer).updateAprPercentage(6, 10000)).to.emit(
      stake,
      "AprPercentageUpdated"
    );
    await mockNfe.connect(deployer).mint(user.address, 3);
    await mockNfe.connect(deployer).setTokenValue(3, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3800;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 3, period, rate, exp]
    );
    const s = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(s.sign(h)).serialized;
    await expect(stake.connect(user).staking(3, period, rate, exp, sig)).to.emit(stake, "Staking");
  });

  it("updates restricted re-staking and checks isRestricted", async function () {
    await stake.connect(deployer).updateRestrictedReStaking(2);
    expect(await stake.isRestricted(1)).to.equal(false);
    expect(await stake.isRestricted(2)).to.equal(true);
    await stake.connect(deployer).updateRestrictedReStaking(0);
    expect(await stake.isRestricted(100)).to.equal(false);
  });

  it("rejects second stake when restricted re-staking limit reached for tokenId", async function () {
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    await stake.connect(deployer).updateRestrictedReStaking(1);
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3700;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 1, period, rate, exp]
    );
    const s = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(s.sign(h)).serialized;
    await expect(
      stake.connect(user).staking(1, period, rate, exp, sig)
    ).to.be.rejectedWith("ST3: Restricted re-staking has exceeded the maximum limit");
    await stake.connect(deployer).updateRestrictedReStaking(0);
  });

  it("updatePenaltyPercentage guard rails and event", async function () {
    await expect(stake.connect(deployer).updatePenaltyPercentage(6, ethers.parseUnits("2", 18))).to.be.rejectedWith(
      "PV1: penaltyPercentage should be less than PPM"
    );
    await expect(stake.connect(deployer).updatePenaltyPercentage(6, 9000)).to.be.rejectedWith(
      "PV2: penaltyPercentage should be between 10 - 20 %"
    );
    await expect(stake.connect(deployer).updatePenaltyPercentage(6, 20000)).to.emit(
      stake,
      "PenaltyPercentageUpdated"
    );
  });

  it("calculates penalty values and BRV", async function () {
    const apr = 120000;
    const period = 6;
    const penaltyPct = 100000;
    const res = await stake.calculatePenaltyValue(apr, period, penaltyPct);
    const base = ((apr / 12) * (period - 1));
    const expectedPenalty = BigInt(base) - (BigInt(base) * BigInt(penaltyPct)) / 1000000n;
    expect(res).to.equal(expectedPenalty);
    const brvPenalty = await stake.calculatePenaltyBRV(1000000000n, 100000);
    expect(brvPenalty).to.equal(100000000n);
  });

  it("GPV, AMP, SPP, BRV and calculateBasedRewardValue", async function () {
    const tokenRate = ethers.parseEther("1");
    const tokenValue = ethers.parseEther("200");
    const apr = 120000;
    const period = 6;
    const gpv = await stake.GPV(tokenRate, tokenValue);
    expect(gpv).to.equal(ethers.parseEther("200"));
    const amp = await stake.AMP(apr);
    const expectedAmp = BigInt(apr) * 10n / 12n;
    expect(amp).to.equal(expectedAmp);
    const spp = await stake.SPP(expectedAmp, period);
    expect(spp).to.equal(expectedAmp * BigInt(period));
    const brv = await stake.BRV(gpv, spp);
    const expectedBrv = (gpv * spp) / 10000000n;
    expect(brv).to.equal(expectedBrv);
    const cbrv = await stake.calculateBasedRewardValue(apr, tokenRate, tokenValue, period);
    expect(cbrv).to.equal(expectedBrv);
  });

  it("convertUsdtToToken and getCertPriceInUsdt", async function () {
    const tokenRate = ethers.parseEther("1");
    const usdtAmount = 1000000n;
    const tokenAmount = await stake.convertUsdtToToken(usdtAmount, tokenRate);
    expect(tokenAmount).to.equal(usdtAmount);
    const certUsdt = await stake.getCertPriceInUsdt(tokenRate, ethers.parseEther("200"));
    expect(certUsdt).to.equal(ethers.parseEther("200"));
  });

  it("periodList reports active APR periods", async function () {
    const list = await stake.periodList();
    expect(list).to.include.members([3n, 6n, 9n, 12n]);
  });

  it("period and forcedUnstake timestamps", async function () {
    const now = Math.floor(Date.now() / 1000);
    const endTs = await stake.periodInUnixTimestamp(6);
    const forcedTs = await stake.forcedUnstakePeriodInUnixTimestamp(Number(endTs));
    expect(endTs).to.be.greaterThan(BigInt(now));
    expect(forcedTs).to.equal(endTs - 60n);
  });

  it("calculatePercentage basis points", async function () {
    const value = 1000000000n;
    const pct = await stake.calculatePercentage(value, 10000);
    expect(pct).to.equal(10000000n);
  });

  it("updatePercentageUsed toggles and emits", async function () {
    await expect(stake.connect(deployer).updatePercentageUsed(true)).to.emit(stake, "PercentageUsedUpdated");
    await expect(stake.connect(deployer).updatePercentageUsed(false)).to.emit(stake, "PercentageUsedUpdated");
  });

  it("admin forceStop closes stake and emits", async function () {
    await mockNfe.connect(deployer).mint(user.address, 4);
    await mockNfe.connect(deployer).setTokenValue(4, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 6000;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 4, period, rate, exp]
    );
    const s = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(s.sign(h)).serialized;
    const tx = await stake.connect(user).staking(4, period, rate, exp, sig);
    const rc = await tx.wait();
    const log = rc.logs.find(l => l.address === stake.target);
    const parsed = stake.interface.parseLog(log);
    const stakeId = parsed.args[0];
    await expect(stake.connect(deployer).forceStop(stakeId)).to.emit(stake, "ForceStop");
  });

  it("unstaking rejects expired signature and before forced time", async function () {
    await mockNfe.connect(deployer).mint(user.address, 6);
    await mockNfe.connect(deployer).setTokenValue(6, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const expStake = Math.floor(Date.now() / 1000) + 6000;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 6, period, rate, expStake]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(h)).serialized;
    const tx = await stake.connect(user).staking(6, period, rate, expStake, sig);
    const rc = await tx.wait();
    const log = rc.logs.find(l => l.address === stake.target);
    const parsed = stake.interface.parseLog(log);
    const stakeId = parsed.args[0];
    const expBad = Math.floor(Date.now() / 1000) - 10;
    const uhBad = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [user.address, stakeId, rate, expBad]
    );
    const sigBad = ethers.Signature.from(sk.sign(uhBad)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, expBad, sigBad)
    ).to.be.rejectedWith("Signature is expired.");
    const expNow = Math.floor(Date.now() / 1000) + 6010;
    const uhNow = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [user.address, stakeId, rate, expNow]
    );
    const sigNow = ethers.Signature.from(sk.sign(uhNow)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, expNow, sigNow)
    ).to.be.rejectedWith("US4: unable to unstake.");
  });

  it("unstaking rejects invalid signer and not staker", async function () {
    await mockNfe.connect(deployer).mint(user.address, 7);
    await mockNfe.connect(deployer).setTokenValue(7, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const expStake = Math.floor(Date.now() / 1000) + 6000;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 7, period, rate, expStake]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(h)).serialized;
    const tx = await stake.connect(user).staking(7, period, rate, expStake, sig);
    const rc = await tx.wait();
    const log = rc.logs.find(l => l.address === stake.target);
    const parsed = stake.interface.parseLog(log);
    const stakeId = parsed.args[0];
    const exp = Math.floor(Date.now() / 1000) + 6010;
    const uh = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [user.address, stakeId, rate, exp]
    );
    const fake = ethers.Wallet.createRandom();
    const sigInvalid = ethers.Signature.from(new ethers.SigningKey(fake.privateKey).sign(uh)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, exp, sigInvalid)
    ).to.be.rejectedWith("US1: Invalid signer.");
    const uhOther = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [other.address, stakeId, rate, exp]
    );
    const sigOkOther = ethers.Signature.from(sk.sign(uhOther)).serialized;
    await expect(
      stake.connect(other).unStaking(stakeId, rate, exp, sigOkOther)
    ).to.be.rejectedWith("US3: msg sender should be the staker address.");
    const sigOk = ethers.Signature.from(sk.sign(uh)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, exp, sigOk)
    ).to.be.rejectedWith("US4: unable to unstake.");
  });

  it("unstaking fails on reward allowance and succeeds when funded", async function () {
    await mockNfe.connect(deployer).mint(user.address, 8);
    await mockNfe.connect(deployer).setTokenValue(8, ethers.parseEther("200"));
    await mockNfe.connect(user).setApprovalForAll(stake.target, true);
    const period = 6;
    const rate = ethers.parseEther("1");
    const expStake = Math.floor(Date.now() / 1000) + 6000;
    const h = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [user.address, 8, period, rate, expStake]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const sig = ethers.Signature.from(sk.sign(h)).serialized;
    const tx = await stake.connect(user).staking(8, period, rate, expStake, sig);
    const rc = await tx.wait();
    const log = rc.logs.find(l => l.address === stake.target);
    const parsed = stake.interface.parseLog(log);
    const stakeId = parsed.args[0];
    // advance time beyond forcedUnstakeAt
    await ethers.provider.send("evm_increaseTime", [400]);
    await ethers.provider.send("evm_mine");
    const exp = Math.floor(Date.now() / 1000) + 6010;
    const uh = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [user.address, stakeId, rate, exp]
    );
    const sigUnstake = ethers.Signature.from(sk.sign(uh)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, exp, sigUnstake)
    ).to.be.rejectedWith("Insufficient reward balance");
    // fund reward and approve allowance
    await dpToken.connect(deployer).transfer(reward.address, ethers.parseEther("1000"));
    await dpToken.connect(reward).increaseAllowance(stake.target, ethers.parseEther("100000000"));
    await expect(
      stake.connect(user).unStaking(stakeId, rate, exp, sigUnstake)
    ).to.emit(stake, "UnStaking");
    // second call rejects as already unstaked
    const exp2 = Math.floor(Date.now() / 1000) + 6020;
    const uh2 = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [user.address, stakeId, rate, exp2]
    );
    const sig2 = ethers.Signature.from(sk.sign(uh2)).serialized;
    await expect(
      stake.connect(user).unStaking(stakeId, rate, exp2, sig2)
    ).to.be.rejectedWith("US2: this stakeId has been unstaked.");
  });
});

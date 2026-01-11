const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StableStaking", function () {
  let deployer, pool, lockPool;
  let dpToken, staking, authSigner;

  before(async function () {
    [deployer, pool, lockPool] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const StableStaking = await ethers.getContractFactory("StableStaking");
    authSigner = ethers.Wallet.createRandom();
    staking = await StableStaking.deploy(
      dpToken.target,
      pool.address,
      dpToken.target,
      lockPool.address,
      authSigner.address
    );
    await staking.waitForDeployment();
  });

  it("initializes references and thresholds", async function () {
    const minBronze = await staking.MIN_BRONZE_THRESHOLD();
    expect(minBronze).to.equal(100000n * 10n ** 18n);
    const cat0 = await staking.tierCategories(0);
    expect(cat0).to.equal("Notier");
  });

  it("getUserTier and getGlobalUserTier respond correctly", async function () {
    const noTier = await staking.getUserTier(0);
    expect(Number(noTier)).to.equal(0);
    const vipTier = await staking.getUserTier(ethers.parseEther("2000000"));
    expect(Number(vipTier)).to.equal(4);
    const globalTier = await staking.getGlobalUserTier(deployer.address, 0);
    expect(Number(globalTier)).to.equal(3);
  });

  it("admin updates require owner/admin", async function () {
    await expect(staking.connect(pool).addOrRemoveAdmin(pool.address, true)).to.be.rejectedWith("OwnableUnauthorizedAccount");
    await expect(staking.connect(deployer).addOrRemoveAdmin(pool.address, true)).to.emit(staking, "AdminUpdated").withArgs(pool.address, true);
    await expect(staking.connect(pool).pause()).to.emit(staking, "ContractStateChanged");
    await expect(staking.connect(pool).unpause()).to.emit(staking, "ContractStateChanged");
    await expect(staking.connect(pool).updateLockMode(true)).to.emit(staking, "LockModeUpdated");
  });

  it("reverts stake when paused", async function () {
    await staking.connect(pool).pause();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = "0x";
    await expect(
      staking.connect(deployer).stake(0, 6, ethers.parseEther("1000"), true, exp, sig)
    ).to.be.reverted;
    await staking.connect(pool).unpause();
  });

  it("reverts stake with invalid period", async function () {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, 24, ethers.parseUnits("1000", 18), true, exp]
    );
    const sk = new ethers.SigningKey(authSigner.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, 24, ethers.parseUnits("1000", 18), true, exp, sig)
    ).to.be.rejectedWith("Invalid period");
  });

  it("reverts stake with expired signature", async function () {
    const exp = Math.floor(Date.now() / 1000) - 10;
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, 6, ethers.parseUnits("1000", 18), true, exp]
    );
    const sk = new ethers.SigningKey(authSigner.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, 6, ethers.parseUnits("1000", 18), true, exp, sig)
    ).to.be.rejectedWith("Signature expired.");
  });

  it("reverts stake with invalid signer", async function () {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fake = ethers.Wallet.createRandom();
    const msgHash = ethers.solidityPackedKeccak256(
      ["address","address","uint8","uint256","uint256","bool","uint256"],
      [staking.target, deployer.address, 0, 6, ethers.parseUnits("1000", 18), true, exp]
    );
    const sk = new ethers.SigningKey(fake.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).stake(0, 6, ethers.parseUnits("1000", 18), true, exp, sig)
    ).to.be.rejectedWith("Invalid signer.");
  });

  it("withdrawInterest reverts on mismatched arrays", async function () {
    const months = [1,2];
    const interests = [ethers.parseUnits("10", 18)];
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const msgHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address","address","uint256","uint256[]","uint256[]","uint256"],
        [staking.target, deployer.address, 1, months, interests, exp]
      )
    );
    const sk = new ethers.SigningKey(authSigner.privateKey);
    const sig = ethers.Signature.from(sk.sign(msgHash)).serialized;
    await expect(
      staking.connect(deployer).withdrawInterest(1, months, interests, exp, sig)
    ).to.be.rejectedWith("Mismatched array lengths");
  });
});

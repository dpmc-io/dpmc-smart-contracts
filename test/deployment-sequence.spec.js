const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deployment Sequence Integration", function () {
  let deployer, receiver, tax, payout, reward, stakingPool, lockingPool, signer;
  let dpToken, certificate, redeem, stake, stableStaking, dao;

  before(async function () {
    [deployer, receiver, tax, payout, reward, stakingPool, lockingPool, signer] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(receiver.address, tax.address, 25000);
    await dpToken.waitForDeployment();

    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    certificate = await CERTIFICATE.deploy();
    await certificate.waitForDeployment();

    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();

    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();

    const MockLock = await ethers.getContractFactory("MockLockToken");
    const usdt = await MockLock.deploy("USDT", "USDT", ethers.parseUnits("1000000", 6), stakingPool.address);
    await usdt.waitForDeployment();

    const StableStaking = await ethers.getContractFactory("StableStaking");
    stableStaking = await StableStaking.deploy(
      await usdt.getAddress(),
      stakingPool.address,
      dpToken.target,
      lockingPool.address,
      signer.address
    );
    await stableStaking.waitForDeployment();

    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    dao = await GovernanceDAO.deploy();
    await dao.waitForDeployment();
  });

  it("wires integrations and verifies addresses", async function () {
    await expect(certificate.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(certificate, "AdminUpdated");
    await expect(redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(redeem, "AddOrRemoveAdmin");
    await expect(stake.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(stake, "AdminUpdated");
    await expect(stableStaking.connect(deployer).addOrRemoveAdmin(stakingPool.address, true)).to.emit(stableStaking, "AdminUpdated");
    await expect(dao.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(dao, "AdminUpdated");

    await expect(dpToken.connect(deployer).setStakingContract(stableStaking.target, true)).to.emit(dpToken, "StakingContractUpdated");

    await expect(certificate.connect(deployer).updatePaymentToken(dpToken.target)).to.emit(certificate, "PaymentTokenAddressUpdated");
    await expect(certificate.connect(deployer).updatePaymentPool(payout.address)).to.emit(certificate, "PaymentPoolAddressUpdated");
    await expect(certificate.connect(deployer).updateRedeem(redeem.target)).to.emit(certificate, "RedeemUpdated");
    await expect(certificate.connect(deployer).updateStaking(stake.target)).to.emit(certificate, "StakingUpdated");

    await expect(redeem.connect(deployer).updateNFEaddress(certificate.target)).to.emit(redeem, "UpdateNFEaddress");
    await expect(redeem.connect(deployer).updateDPMCaddress(dpToken.target)).to.emit(redeem, "UpdateDPMCaddress");
    await expect(redeem.connect(deployer).updatePayoutAddress(payout.address)).to.emit(redeem, "UpdatePayoutAddress");

    await expect(stake.connect(deployer).updateNFEaddress(certificate.target)).to.emit(stake, "NFEAddressUpdated");
    await expect(stake.connect(deployer).updateDPMCaddress(dpToken.target)).to.emit(stake, "DPMCAddressUpdated");
    await expect(stake.connect(deployer).updateRewardAddress(reward.address)).to.emit(stake, "RewardAddressUpdated");
    await expect(stake.connect(deployer).updateSignerAddress(signer.address)).to.emit(stake, "SignerAddressUpdated");

    await expect(dao.connect(deployer).updateTokenLock(dpToken.target)).to.emit(dao, "ContractUpdated");
    await expect(dao.connect(deployer).updateUsdtStake(stableStaking.target)).to.emit(dao, "ContractUpdated");
    await expect(dao.connect(deployer).updateUsdcStake(stableStaking.target)).to.emit(dao, "ContractUpdated");

    const isStaking = await dpToken.stakingContract(stableStaking.target);
    expect(isStaking).to.equal(true);

    expect(await certificate.paymentToken()).to.equal(dpToken.target);
    expect(await certificate.paymentPool()).to.equal(payout.address);
    expect(await certificate.redeem()).to.equal(redeem.target);
    expect(await certificate.staking()).to.equal(stake.target);

    expect(await redeem.erc721token()).to.equal(certificate.target);
    expect(await redeem.erc20token()).to.equal(dpToken.target);
    expect(await redeem.PAYOUT()).to.equal(payout.address);

    expect(await stake.erc721token()).to.equal(certificate.target);
    expect(await stake.erc20token()).to.equal(dpToken.target);
    expect(await stake.REWARD()).to.equal(reward.address);
  });

  it("dao tier reflects token lock updates", async function () {
    await expect(dpToken.connect(deployer).setStakingContract(deployer.address, true)).to.emit(dpToken, "StakingContractUpdated");
    await expect(dpToken.connect(deployer).updateLockedAmount(receiver.address, ethers.parseEther("2000000"), true)).to.emit(dpToken, "TokenLockedUpdated");
    const tier = await dao.getTier(receiver.address);
    expect(Number(tier)).to.be.oneOf([3, 4]);
  });
});

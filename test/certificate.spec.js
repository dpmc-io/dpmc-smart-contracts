const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CERTIFICATE", function () {
  let deployer, staking, redeem, pool, token;
  let certificate;

  before(async function () {
    [deployer, staking, redeem, pool, token] = await ethers.getSigners();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    certificate = await CERTIFICATE.deploy();
    await certificate.waitForDeployment();
  });

  it("admin wiring updates addresses", async function () {
    await expect(certificate.connect(deployer).addOrRemoveAdmin(deployer.address, true)).to.emit(certificate, "AdminUpdated").withArgs(deployer.address, true);
    const prevPaymentToken = await certificate.paymentToken();
    await expect(certificate.connect(deployer).updatePaymentToken(token.address)).to.emit(certificate, "PaymentTokenAddressUpdated").withArgs(prevPaymentToken, token.address);
    const prevPaymentPool = await certificate.paymentPool();
    await expect(certificate.connect(deployer).updatePaymentPool(pool.address)).to.emit(certificate, "PaymentPoolAddressUpdated").withArgs(prevPaymentPool, pool.address);
    const prevRedeem = await certificate.redeem();
    await expect(certificate.connect(deployer).updateRedeem(redeem.address)).to.emit(certificate, "RedeemUpdated").withArgs(prevRedeem, redeem.address);
    const prevStaking = await certificate.staking();
    await expect(certificate.connect(deployer).updateStaking(staking.address)).to.emit(certificate, "StakingUpdated").withArgs(prevStaking, staking.address);
  });

  it("transfer restrictions toggle", async function () {
    await expect(certificate.connect(deployer).updateTransferRestriction(true)).to.emit(certificate, "TransferRestrictionUpdated");
    const tx = await certificate.connect(deployer).setAllowedAddress(pool.address);
    await tx.wait();
    await expect(certificate.connect(deployer).removeAllowedAddress(pool.address)).to.emit(certificate, "AllowedAddressUpdated").withArgs(pool.address, false);
  });

  it("tokenURI reverts for nonexistent token", async function () {
    await expect(certificate.tokenURI(1)).to.be.rejectedWith("Token does not exist");
  });
});

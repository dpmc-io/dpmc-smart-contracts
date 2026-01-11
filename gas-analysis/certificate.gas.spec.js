const { ethers } = require("hardhat");

describe("Gas: CERTIFICATE", function () {
  let deployer, pool, stake, redeem, token, cert;

  before(async function () {
    [deployer, pool] = await ethers.getSigners();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    cert = await CERTIFICATE.deploy();
    await cert.waitForDeployment();
    const DPToken = await ethers.getContractFactory("DPToken");
    token = await DPToken.deploy(deployer.address, pool.address, 100000);
    await token.waitForDeployment();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();
  });

  it("admin updates and transfer restrictions", async function () {
    await cert.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await cert.connect(deployer).updatePaymentToken(token.target);
    await cert.connect(deployer).updatePaymentPool(pool.address);
    await cert.connect(deployer).updateRedeem(redeem.target);
    await cert.connect(deployer).updateStaking(stake.target);
    await cert.connect(deployer).updateTransferRestriction(true);
    await cert.connect(deployer).setAllowedAddress(pool.address);
    await cert.connect(deployer).removeAllowedAddress(pool.address);
  });
});

const { ethers } = require("hardhat");

describe("Gas: REDEEM", function () {
  let deployer, pool, token, cert, redeem;

  before(async function () {
    [deployer, pool] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    token = await DPToken.deploy(deployer.address, pool.address, 100000);
    await token.waitForDeployment();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    cert = await CERTIFICATE.deploy();
    await cert.waitForDeployment();
    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();
    await redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true);
  });

  it("admin wiring updates and simple operations", async function () {
    await redeem.connect(deployer).updateNFEaddress(cert.target);
    await redeem.connect(deployer).updateDPMCaddress(token.target);
    await redeem.connect(deployer).updatePayoutAddress(pool.address);
  });
});

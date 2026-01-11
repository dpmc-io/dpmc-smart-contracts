const { ethers } = require("hardhat");

describe("Gas: STAKE", function () {
  let deployer, reward, token, cert, stake;

  before(async function () {
    [deployer, reward] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    token = await DPToken.deploy(deployer.address, reward.address, 100000);
    await token.waitForDeployment();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    cert = await CERTIFICATE.deploy();
    await cert.waitForDeployment();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true);
  });

  it("admin wiring updates and toggles", async function () {
    await stake.connect(deployer).updateNFEaddress(cert.target);
    await stake.connect(deployer).updateDPMCaddress(token.target);
    await stake.connect(deployer).updateRewardAddress(reward.address);
    await stake.connect(deployer).updatePercentageUsed(true);
    await stake.connect(deployer).updateAprPercentage(6, 10000);
    await stake.connect(deployer).updatePenaltyPercentage(6, 100000);
  });
});

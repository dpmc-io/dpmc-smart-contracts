const { ethers } = require("hardhat");

describe("Gas: DPToken", function () {
  let deployer, other, third, token;

  before(async function () {
    [deployer, other, third] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    token = await DPToken.deploy(deployer.address, other.address, 100000);
    await token.waitForDeployment();
  });

  it("owner pause/unpause, whitelist/blacklist, transfer", async function () {
    await token.connect(deployer).pause();
    await token.connect(deployer).unpause();
    await token.connect(deployer).addWhitelist(third.address);
    await token.connect(deployer).removeFromWhitelist(third.address);
    await token.connect(deployer).addBlacklist(third.address);
    await token.connect(deployer).removeFromBlacklist(third.address);
    const balance = await token.balanceOf(deployer.address);
    await token.connect(deployer).transfer(third.address, balance / 2n);
  });
});


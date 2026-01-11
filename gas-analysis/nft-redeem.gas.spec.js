const { ethers } = require("hardhat");

describe("Gas: REDEEM (NFT Redeem)", function () {
  let deployer, pool, user, nfe, pay, redeem;

  before(async function () {
    [deployer, pool, user] = await ethers.getSigners();
    const MockNFE = await ethers.getContractFactory("MockNFE721");
    nfe = await MockNFE.deploy();
    await nfe.waitForDeployment();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    pay = await MockLock.deploy("PAY", "PAY", ethers.parseUnits("1000000", 18), pool.address);
    await pay.waitForDeployment();
    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();
    await redeem.connect(deployer).updateNFEaddress(await nfe.getAddress());
    await redeem.connect(deployer).updateDPMCaddress(await pay.getAddress());
    await redeem.connect(deployer).updatePayoutAddress(pool.address);
    await nfe.connect(deployer).mint(user.address, 1);
    await nfe.connect(deployer).setTokenValue(1, ethers.parseUnits("200", 18));
    await pay.connect(pool).approve(await redeem.getAddress(), ethers.parseUnits("1000000", 18));
  });

  it("redeem path", async function () {
    await nfe.connect(user).setApprovalForAll(await redeem.getAddress(), true);
    await redeem.connect(user).redeem(1);
  });
});


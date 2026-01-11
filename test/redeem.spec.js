const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("REDEEM", function () {
  let deployer, payout, user;
  let dpToken, redeem, nfe;

  before(async function () {
    [deployer, payout, user] = await ethers.getSigners();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(payout.address, deployer.address, 0);
    await dpToken.waitForDeployment();

    const MockNFE721 = await ethers.getContractFactory("MockNFE721");
    nfe = await MockNFE721.deploy();
    await nfe.waitForDeployment();

    const REDEEM = await ethers.getContractFactory("REDEEM");
    redeem = await REDEEM.deploy();
    await redeem.waitForDeployment();

    await redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await redeem.connect(deployer).updateNFEaddress(nfe.target);
    await redeem.connect(deployer).updateDPMCaddress(dpToken.target);
    await redeem.connect(deployer).updatePayoutAddress(payout.address);
  });

  it("redeems NFT and pays DPToken from payout", async function () {
    await nfe.connect(deployer).mint(user.address, 1);
    await nfe.connect(deployer).setTokenValue(1, ethers.parseEther("100"));
    await nfe.connect(user).setApprovalForAll(redeem.target, true);
    await dpToken.connect(payout).increaseAllowance(redeem.target, ethers.parseEther("1000"));
    const balBefore = await dpToken.balanceOf(user.address);
    await expect(redeem.connect(user).redeem(1)).to.emit(redeem, "Redeem");
    const balAfter = await dpToken.balanceOf(user.address);
    expect(balAfter - balBefore).to.equal(ethers.parseEther("100"));
  });
});

const { ethers } = require("hardhat");

describe("Gas: STAKE (NFT Staking)", function () {
  let deployer, user, reward, nfe, erc20, stake;

  before(async function () {
    [deployer, user, reward] = await ethers.getSigners();
    const MockNFE = await ethers.getContractFactory("MockNFE721");
    nfe = await MockNFE.deploy();
    await nfe.waitForDeployment();
    await nfe.connect(deployer).mint(user.address, 1);
    await nfe.connect(deployer).setTokenValue(1, ethers.parseUnits("200", 18));
    const MockLock = await ethers.getContractFactory("MockLockToken");
    erc20 = await MockLock.deploy("Pay","PAY",ethers.parseUnits("1000000",18), reward.address);
    await erc20.waitForDeployment();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await stake.connect(deployer).updateNFEaddress(await nfe.getAddress());
    await stake.connect(deployer).updateDPMCaddress(await erc20.getAddress());
    await stake.connect(deployer).updateRewardAddress(reward.address);
    const signerWallet = ethers.Wallet.createRandom();
    await stake.connect(deployer).updateSignerAddress(signerWallet.address);
    await nfe.connect(user).setApprovalForAll(await stake.getAddress(), true);
    this.signerWallet = signerWallet;
  });

  it("staking path (valid signature)", async function () {
    const period = 6;
    const rate = ethers.parseEther("1");
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const h = ethers.solidityPackedKeccak256(["address","uint256","uint8","uint256","uint256"], [user.address, 1, period, rate, exp]);
    const sig = ethers.Signature.from(new ethers.SigningKey(this.signerWallet.privateKey).sign(h)).serialized;
    await stake.connect(user).staking(1, period, rate, exp, sig);
  });
});

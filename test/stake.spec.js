const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("STAKE", function () {
  let deployer, user, reward, mni, nfe;
  let stake, dpToken, mockNfe, attacker, sigWallet;

  before(async function () {
    [deployer, user, reward, mni, nfe] = await ethers.getSigners();
    const STAKE = await ethers.getContractFactory("STAKE");
    stake = await STAKE.deploy();
    await stake.waitForDeployment();
    const DPToken = await ethers.getContractFactory("DPToken");
    dpToken = await DPToken.deploy(deployer.address, deployer.address, 0);
    await dpToken.waitForDeployment();
    const MockNFE721 = await ethers.getContractFactory("MockNFE721");
    mockNfe = await MockNFE721.deploy();
    await mockNfe.waitForDeployment();
    const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
    attacker = await ReentrancyAttacker.deploy();
    await attacker.waitForDeployment();
    await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await stake.connect(deployer).updateNFEaddress(mockNfe.target);
    await stake.connect(deployer).updateDPMCaddress(dpToken.target);
    await stake.connect(deployer).updateRewardAddress(reward.address);
    sigWallet = ethers.Wallet.createRandom();
    await stake.connect(deployer).updateSignerAddress(sigWallet.address);
  });

  it("records ERC721 received data", async function () {
    const data = ethers.toUtf8Bytes("x");
    await mockNfe.connect(deployer).mint(user.address, 5);
    await mockNfe.connect(user).safeTransferFrom(user.address, stake.target, 5);
    const rec = await stake.receivedERC721(user.address, 5);
    expect(rec.from).to.equal(user.address);
    expect(Number(rec.tokenId)).to.equal(5);
  });

  it("admin can pause and unpause", async function () {
    await expect(stake.connect(deployer).pause()).to.emit(stake, "Paused");
    await expect(stake.connect(deployer).unpause()).to.emit(stake, "Unpaused");
  });

  it("reentrancy is blocked during forceStop -> onERC721Received -> unStaking", async function () {
    const tokenId = 101;
    await mockNfe.connect(deployer).mint(attacker.target, tokenId);
    await mockNfe.connect(deployer).setTokenValue(tokenId, ethers.parseEther("200"));
    await attacker.connect(deployer).setup(stake.target, mockNfe.target);
    await attacker.connect(deployer).approveForStake();
    const stakePeriod = 6;
    const tokenRateUSDT = ethers.parseEther("1");
    const expStake = Math.floor(Date.now() / 1000) + 3600;
    const stakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint8","uint256","uint256"],
      [attacker.target, tokenId, stakePeriod, tokenRateUSDT, expStake]
    );
    const sk = new ethers.SigningKey(sigWallet.privateKey);
    const stakeSig = ethers.Signature.from(sk.sign(stakeHash)).serialized;
    await attacker.stakeOnce(tokenId, stakePeriod, tokenRateUSDT, expStake, stakeSig);
    const stakeId = 1;
    const expUnstake = Math.floor(Date.now() / 1000) + 7200;
    const unstakeHash = ethers.solidityPackedKeccak256(
      ["address","uint256","uint256","uint256"],
      [attacker.target, stakeId, tokenRateUSDT, expUnstake]
    );
    const unstakeSig = ethers.Signature.from(sk.sign(unstakeHash)).serialized;
    await attacker.setReenterParams(stakeId, tokenRateUSDT, expUnstake, unstakeSig);
    await expect(stake.connect(deployer).forceStop(stakeId)).to.be.reverted;
  });

  // Negative-path tests can be added later if needed
});

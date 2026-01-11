const { ethers } = require("hardhat");

describe("Gas: CERTIFICATE (NFT Minting)", function () {
  let deployer, pool, cert, pay;

  before(async function () {
    [deployer, pool] = await ethers.getSigners();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    pay = await MockLock.deploy("PAY", "PAY", ethers.parseUnits("1000000", 18), deployer.address);
    await pay.waitForDeployment();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    cert = await CERTIFICATE.deploy();
    await cert.waitForDeployment();
    await cert.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await cert.connect(deployer).updatePaymentToken(await pay.getAddress());
    await cert.connect(deployer).updatePaymentPool(pool.address);
  });

  it("admin updates and transfer restriction toggles", async function () {
    await cert.connect(deployer).updateTransferRestriction(true);
    await cert.connect(deployer).updateTransferRestriction(false);
  });

  it("rejects mint with invalid signer", async function () {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const wallet = ethers.Wallet.createRandom();
    const hash = ethers.keccak256(
      ethers.solidityPacked(["address", "uint256"], [deployer.address, exp])
    );
    const sig = wallet.signingKey.sign(hash).serialized;
    const value = ethers.parseUnits("10", 18);
    let reverted = false;
    try {
      await cert
        .connect(deployer)
        .mint(value, deployer.address, exp, sig);
    } catch (e) {
      reverted = true;
    }
    if (!reverted) {
      throw new Error("expected revert");
    }
  });
});

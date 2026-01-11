const { expect } = require("chai");
const { ethers } = require("hardhat");

 

describe("CERTIFICATE Security", function () {
  let deployer, pool, user;
  let erc20, cert;

  before(async function () {
    [deployer, pool, user] = await ethers.getSigners();
    const MockLock = await ethers.getContractFactory("MockLockToken");
    erc20 = await MockLock.deploy("Pay", "PAY", ethers.parseUnits("1000000", 18), deployer.address);
    await erc20.waitForDeployment();
    const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
    cert = await CERTIFICATE.deploy();
    await cert.waitForDeployment();
    await cert.connect(deployer).addOrRemoveAdmin(deployer.address, true);
    await cert.connect(deployer).updatePaymentToken(await erc20.getAddress());
    await cert.connect(deployer).updatePaymentPool(pool.address);
  });

  it("only admin can update wiring and restriction", async function () {
    await expect(cert.connect(user).updatePaymentToken(user.address)).to.be.rejectedWith("Admin only");
    await expect(cert.connect(deployer).updateTransferRestriction(true)).to.emit(cert, "TransferRestrictionUpdated");
    await expect(cert.connect(deployer).updateTransferRestriction(false)).to.emit(cert, "TransferRestrictionUpdated");
  });

  it("mint rejects invalid signer", async function () {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const fake = ethers.Wallet.createRandom();
    const h = ethers.solidityPackedKeccak256(["address","uint256"], [deployer.address, exp]);
    const sigBad = ethers.Signature.from(new ethers.SigningKey(fake.privateKey).sign(h)).serialized;
    await expect(cert.connect(deployer).mint(ethers.parseUnits("100",18), deployer.address, exp, sigBad)).to.be.rejectedWith("Invalid signer");
  });

 
});

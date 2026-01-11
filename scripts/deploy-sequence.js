const { network, ethers } = require("hardhat");
const fs = require("fs");
const { execSync } = require("node:child_process");

async function main() {
  const { name, config } = network;
  execSync(`node scripts/validate-env.js ${name} sequence`, { stdio: "inherit" });
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${name} (chainId=${config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const receiver = process.env.DP_RECEIVER || deployer.address;
  const tax = process.env.DP_TAX || deployer.address;
  const buyTaxPPM = Number(process.env.DP_BUY_TAX_PPM || 25000);
  const payoutPool = process.env.PAYMENT_POOL || deployer.address;
  const rewardPool = process.env.REWARD_POOL || deployer.address;
  const signerAddr = process.env.AUTH_SIGNER || deployer.address;
  const usdtAddr = process.env.USDT_ADDRESS || "";
  const lockingPool = process.env.LOCKING_POOL || deployer.address;
  const stakingPool = process.env.STAKING_POOL || deployer.address;

  const DPToken = await ethers.getContractFactory("DPToken");
  const dpToken = await DPToken.deploy(receiver, tax, buyTaxPPM);
  await dpToken.waitForDeployment();
  console.log(`DPToken: ${dpToken.target}`);

  let stakingTokenAddress = usdtAddr;
  let lockingTokenAddress = dpToken.target;

  if (!stakingTokenAddress) {
    const MockLock = await ethers.getContractFactory("MockLockToken");
    const mockUSDT = await MockLock.deploy("USDT", "USDT", ethers.parseUnits("100000000", 6), stakingPool);
    await mockUSDT.waitForDeployment();
    stakingTokenAddress = await mockUSDT.getAddress();
    console.log(`Mock USDT: ${stakingTokenAddress}`);
  }

  const CERTIFICATE = await ethers.getContractFactory("CERTIFICATE");
  const certificate = await CERTIFICATE.deploy();
  await certificate.waitForDeployment();
  console.log(`CERTIFICATE: ${certificate.target}`);

  const REDEEM = await ethers.getContractFactory("REDEEM");
  const redeem = await REDEEM.deploy();
  await redeem.waitForDeployment();
  console.log(`REDEEM: ${redeem.target}`);

  const STAKE = await ethers.getContractFactory("STAKE");
  const stake = await STAKE.deploy();
  await stake.waitForDeployment();
  console.log(`STAKE: ${stake.target}`);

  const StableStaking = await ethers.getContractFactory("StableStaking");
  const stableStaking = await StableStaking.deploy(
    stakingTokenAddress,
    stakingPool,
    lockingTokenAddress,
    lockingPool,
    signerAddr
  );
  await stableStaking.waitForDeployment();
  console.log(`StableStaking: ${stableStaking.target}`);

  const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy();
  await governanceDAO.waitForDeployment();
  console.log(`GovernanceDAO: ${governanceDAO.target}`);

  await (await certificate.connect(deployer).addOrRemoveAdmin(deployer.address, true)).wait();
  await (await redeem.connect(deployer).addOrRemoveAdmin(deployer.address, true)).wait();
  await (await stake.connect(deployer).addOrRemoveAdmin(deployer.address, true)).wait();
  await (await stableStaking.connect(deployer).addOrRemoveAdmin(stakingPool, true)).wait();
  await (await governanceDAO.connect(deployer).addOrRemoveAdmin(deployer.address, true)).wait();

  await (await dpToken.connect(deployer).setStakingContract(stableStaking.target, true)).wait();

  await (await certificate.connect(deployer).updatePaymentToken(dpToken.target)).wait();
  await (await certificate.connect(deployer).updatePaymentPool(payoutPool)).wait();
  await (await certificate.connect(deployer).updateRedeem(redeem.target)).wait();
  await (await certificate.connect(deployer).updateStaking(stake.target)).wait();

  await (await redeem.connect(deployer).updateNFEaddress(certificate.target)).wait();
  await (await redeem.connect(deployer).updateDPMCaddress(dpToken.target)).wait();
  await (await redeem.connect(deployer).updatePayoutAddress(payoutPool)).wait();

  await (await stake.connect(deployer).updateNFEaddress(certificate.target)).wait();
  await (await stake.connect(deployer).updateDPMCaddress(dpToken.target)).wait();
  await (await stake.connect(deployer).updateRewardAddress(rewardPool)).wait();
  await (await stake.connect(deployer).updateSignerAddress(signerAddr)).wait();

  await (await governanceDAO.connect(deployer).updateTokenLock(dpToken.target)).wait();
  await (await governanceDAO.connect(deployer).updateUsdtStake(stableStaking.target)).wait();
  await (await governanceDAO.connect(deployer).updateUsdcStake(stableStaking.target)).wait();

  console.log("Integration summary:");
  console.log(`DPToken.stakingContract[StableStaking]: ${await dpToken.stakingContract(stableStaking.target)}`);
  console.log(`CERTIFICATE.paymentToken: ${await certificate.paymentToken()}`);
  console.log(`CERTIFICATE.paymentPool: ${await certificate.paymentPool()}`);
  console.log(`CERTIFICATE.redeem: ${await certificate.redeem()}`);
  console.log(`CERTIFICATE.staking: ${await certificate.staking()}`);
  console.log(`REDEEM.erc721token: ${await redeem.erc721token()}`);
  console.log(`REDEEM.erc20token: ${await redeem.erc20token()}`);
  console.log(`REDEEM.PAYOUT: ${await redeem.PAYOUT()}`);
  console.log(`STAKE.erc721token: ${await stake.erc721token()}`);
  console.log(`STAKE.erc20token: ${await stake.erc20token()}`);
  console.log(`STAKE.REWARD: ${await stake.REWARD()}`);

  const record = {
    network: name,
    addresses: {
      DPToken: dpToken.target,
      CERTIFICATE: certificate.target,
      REDEEM: redeem.target,
      STAKE: stake.target,
      StableStaking: stableStaking.target,
      GovernanceDAO: governanceDAO.target
    },
    constructorArgs: {
      DPToken: [receiver, tax, buyTaxPPM],
      StableStaking: [stakingTokenAddress, stakingPool, lockingTokenAddress, lockingPool, signerAddr]
    },
    timestamp: new Date().toISOString()
  };
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("deployments/last-deploy.json", JSON.stringify(record, null, 2));
  console.log("Saved deployments/last-deploy.json");
  const perNetFile = `deployments/${name}.json`;
  let history = [];
  if (fs.existsSync(perNetFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(perNetFile, "utf8"));
      if (Array.isArray(parsed)) history = parsed;
    } catch {}
  }
  history.push(record);
  fs.writeFileSync(perNetFile, JSON.stringify(history, null, 2));
  console.log(`Appended deployments history to ${perNetFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

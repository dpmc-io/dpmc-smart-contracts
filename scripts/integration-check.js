const { network, ethers } = require("hardhat");

async function main() {
  const { name, config } = network;
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${name} (chainId=${config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const DPToken = await ethers.getContractFactory("DPToken");
  const dpToken = await DPToken.deploy(deployer.address, deployer.address, 25000);
  await dpToken.waitForDeployment();
  console.log(`DPToken: ${dpToken.target}`);

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
    dpToken.target,
    deployer.address,
    dpToken.target,
    deployer.address,
    deployer.address
  );
  await stableStaking.waitForDeployment();
  console.log(`StableStaking: ${stableStaking.target}`);

  const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy();
  await governanceDAO.waitForDeployment();
  console.log(`GovernanceDAO: ${governanceDAO.target}`);

  const tx1 = await dpToken.connect(deployer).setStakingContract(stableStaking.target, true);
  await tx1.wait();

  const tx2 = await certificate.connect(deployer).updatePaymentToken(dpToken.target);
  await tx2.wait();
  const tx3 = await certificate.connect(deployer).updatePaymentPool(deployer.address);
  await tx3.wait();
  const tx4 = await certificate.connect(deployer).updateRedeem(redeem.target);
  await tx4.wait();
  const tx5 = await certificate.connect(deployer).updateStaking(stake.target);
  await tx5.wait();

  const tx6 = await redeem.connect(deployer).updateNFEaddress(certificate.target);
  await tx6.wait();
  const tx7 = await redeem.connect(deployer).updateDPMCaddress(dpToken.target);
  await tx7.wait();
  const tx8 = await redeem.connect(deployer).updatePayoutAddress(deployer.address);
  await tx8.wait();

  const tx9 = await stake.connect(deployer).updateNFEaddress(certificate.target);
  await tx9.wait();
  const tx10 = await stake.connect(deployer).updateDPMCaddress(dpToken.target);
  await tx10.wait();
  const tx11 = await stake.connect(deployer).updateRewardAddress(deployer.address);
  await tx11.wait();

  const tx12 = await governanceDAO.connect(deployer).updateTokenLock(dpToken.target);
  await tx12.wait();
  const tx13 = await governanceDAO.connect(deployer).updateUsdtStake(stableStaking.target);
  await tx13.wait();
  const tx14 = await governanceDAO.connect(deployer).updateUsdcStake(stableStaking.target);
  await tx14.wait();

  console.log("Checking integrations");
  const tier = await governanceDAO.getTier(deployer.address);
  console.log(`GovernanceDAO.getTier: ${tier}`);

  const userInfo = await stableStaking.users(deployer.address);
  console.log(`StableStaking.users.totalStaked: ${userInfo.totalStaked}`);
  console.log(`StableStaking.users.totalLocked: ${userInfo.totalLocked}`);

  const ctPaymentToken = await certificate.paymentToken();
  const ctPaymentPool = await certificate.paymentPool();
  const ctRedeem = await certificate.redeem();
  const ctStaking = await certificate.staking();
  console.log(`CERTIFICATE.paymentToken: ${ctPaymentToken}`);
  console.log(`CERTIFICATE.paymentPool: ${ctPaymentPool}`);
  console.log(`CERTIFICATE.redeem: ${ctRedeem}`);
  console.log(`CERTIFICATE.staking: ${ctStaking}`);

  const rdNfe = await redeem.erc721token();
  const rdMni = await redeem.erc20token();
  const rdPayout = await redeem.PAYOUT();
  console.log(`REDEEM.erc721token: ${rdNfe}`);
  console.log(`REDEEM.erc20token: ${rdMni}`);
  console.log(`REDEEM.PAYOUT: ${rdPayout}`);

  const skNfe = await stake.erc721token();
  const skMni = await stake.erc20token();
  const skReward = await stake.REWARD();
  console.log(`STAKE.erc721token: ${skNfe}`);
  console.log(`STAKE.erc20token: ${skMni}`);
  console.log(`STAKE.REWARD: ${skReward}`);

  const isStakingContract = await dpToken.stakingContract(stableStaking.target);
  console.log(`DPToken.stakingContract[StableStaking]: ${isStakingContract}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

const { network, ethers } = require("hardhat");
const { execSync } = require("node:child_process");

async function main() {
  const { name, config } = network;
  execSync(`node scripts/validate-env.js ${name} basic`, { stdio: "inherit" });
  const signers = await ethers.getSigners();
  console.log(`Network: ${name} (chainId=${config.chainId})`);
  if (signers.length === 0) {
    console.log("No account configured. Set `PRIVATE_KEY` in .env to enable deployments.");
  } else {
    console.log(`Deployer: ${signers[0].address}`);
  }
  const contractName = process.env.CONTRACT;
  const rawArgs = process.env.ARGS || "[]";
  let args = [];
  try {
    args = JSON.parse(rawArgs);
  } catch (e) {
    console.log("Invalid ARGS. Provide JSON array in ARGS env.");
    return;
  }
  if (!contractName) {
    console.log("Set CONTRACT env to deploy a contract. Skipping deployment.");
    return;
  }
  const instance = await ethers.deployContract(contractName, args);
  await instance.waitForDeployment();
  console.log(`Deployed ${contractName} at ${await instance.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

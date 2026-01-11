const { network } = require("hardhat");
const { execSync } = require("node:child_process");
const fs = require("fs");
const registry = require("./utils/addressRegistry");

async function main() {
  const { name } = network;
  const perNetFile = `deployments/${name}.json`;
  let data = registry.readLatest(name);
  const file = "deployments/last-deploy.json";
  if (!data && !fs.existsSync(file)) {
    console.log("No deployment record found at deployments/last-deploy.json");
    console.log("Run the sequenced deploy first to create it.");
    return;
  }
  if (!data) {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  if (data.network !== name) {
    console.log(`Warning: record is for '${data.network}', current network is '${name}'`);
  }
  const addr = data.addresses || {};
  const args = data.constructorArgs || {};

  function runVerify(address, ctorArgs) {
    if (!address) return;
    const argv = ["hardhat", "verify", "--network", name, address].concat((ctorArgs || []).map(String));
    console.log(`Verifying: ${address} with args ${JSON.stringify(ctorArgs || [])}`);
    execSync(argv.join(" "), { stdio: "inherit" });
  }

  runVerify(addr.DPToken, args.DPToken);
  runVerify(addr.CERTIFICATE, []);
  runVerify(addr.REDEEM, []);
  runVerify(addr.STAKE, []);
  runVerify(addr.StableStaking, args.StableStaking);
  runVerify(addr.GovernanceDAO, []);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

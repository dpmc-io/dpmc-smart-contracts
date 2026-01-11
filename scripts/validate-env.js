const requiredCommon = ["PRIVATE_KEY"];
const requiredArbOne = ["ARBITRUM_RPC_URL", "ARBISCAN_API_KEY", "USDT_ADDRESS"];
const requiredArbSepolia = ["ARBITRUM_SEPOLIA_RPC_URL", "ARBISCAN_API_KEY"];
const sequenceVars = [
  "DP_RECEIVER",
  "DP_TAX",
  "DP_BUY_TAX_PPM",
  "PAYMENT_POOL",
  "REWARD_POOL",
  "AUTH_SIGNER",
  "STAKING_POOL",
  "LOCKING_POOL",
];

function check(vars) {
  const missing = vars.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");
  return missing;
}

function main() {
  const net = process.argv[2] || "";
  const mode = process.argv[3] || "sequence";
  const all = [...requiredCommon];
  if (mode === "sequence") all.push(...sequenceVars);
  if (net === "arbitrumOne") all.push(...requiredArbOne);
  if (net === "arbitrumSepolia") all.push(...requiredArbSepolia);
  const missing = check(all);
  if (missing.length) {
    console.error("Missing environment variables:");
    for (const k of missing) console.error(` - ${k}`);
    process.exit(1);
  } else {
    console.log("Environment variables look good.");
  }
}

main();

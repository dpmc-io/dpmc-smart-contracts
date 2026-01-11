require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("hardhat-gas-reporter");

const { PRIVATE_KEY, ARBITRUM_RPC_URL, ARBITRUM_SEPOLIA_RPC_URL, ARBISCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    arbitrumOne: {
      url: ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161,
    },
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: ARBISCAN_API_KEY || "",
      arbitrumSepolia: ARBISCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY || undefined,
    showMethodSig: true,
    showTimeSpent: true,
    noColors: true,
    outputFile: "gas-analysis/gas-report.md",
    onlyCalledMethods: false,
  },
};

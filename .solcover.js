module.exports = {
  solc: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true
    }
  },
  skipFiles: [
    "contracts/mocks"
  ],
  istanbulReporter: ["html", "lcov", "text-summary"]
};

const { ethers } = require("hardhat");

async function advanceTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [Number(seconds)]);
  await ethers.provider.send("evm_mine", []);
}

async function setNextBlockTimestamp(ts) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(ts)]);
  await ethers.provider.send("evm_mine", []);
}

async function mineBlocks(count = 1) {
  for (let i = 0; i < count; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

module.exports = { advanceTime, setNextBlockTimestamp, mineBlocks };


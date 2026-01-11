const { ethers } = require("hardhat");

async function fundWallet(from, to, ethAmount = "1") {
  await from.sendTransaction({ to, value: ethers.parseEther(ethAmount) });
}

async function approveERC20(token, owner, spender, amount) {
  await token.connect(owner).increaseAllowance(spender, amount);
}

function buildStakeHash(contractAddress, wallet, userType, period, amount, tokenLocked, exp) {
  return ethers.solidityPackedKeccak256(
    ["address","address","uint8","uint256","uint256","bool","uint256"],
    [contractAddress, wallet, userType, period, amount, tokenLocked, exp]
  );
}

function buildWithdrawInterestHash(contractAddress, wallet, stakeId, months, interests, exp) {
  return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["address","address","uint256","uint256[]","uint256[]","uint256"],
    [contractAddress, wallet, stakeId, months, interests, exp]
  ));
}

function signHash(signingKey, hash) {
  const sk = new ethers.SigningKey(signingKey);
  return ethers.Signature.from(sk.sign(hash)).serialized;
}

module.exports = {
  fundWallet,
  approveERC20,
  buildStakeHash,
  buildWithdrawInterestHash,
  signHash,
};


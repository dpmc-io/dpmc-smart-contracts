// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ITokenLock {
    function tokenLocked(address account) external view returns (uint256);
    function updateLockedAmount(address account, uint256 amount, bool increase) external;
}

contract MockLockToken is ERC20, ITokenLock {
    mapping(address => uint256) public locked;

    constructor(string memory name_, string memory symbol_, uint256 initialSupply, address receiver) ERC20(name_, symbol_) {
        _mint(receiver, initialSupply);
    }

    function tokenLocked(address account) external view returns (uint256) {
        return locked[account];
    }

    function updateLockedAmount(address account, uint256 amount, bool increase) external {
        if (increase) {
            locked[account] += amount;
        } else {
            require(locked[account] >= amount, "Insufficient locked tokens");
            locked[account] -= amount;
        }
    }
}

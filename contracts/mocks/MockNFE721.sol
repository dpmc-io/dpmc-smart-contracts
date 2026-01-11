// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INFE721 {
    function tokenValue(uint256 tokenId) external view returns (uint256);
}

contract MockNFE721 is ERC721, INFE721, Ownable {
    mapping(uint256 => uint256) public _tokenValue;

    constructor() ERC721("Mock NFE", "MNFE") Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    function setTokenValue(uint256 tokenId, uint256 value) external onlyOwner {
        _tokenValue[tokenId] = value;
    }

    function tokenValue(uint256 tokenId) external view override returns (uint256) {
        return _tokenValue[tokenId];
    }
}

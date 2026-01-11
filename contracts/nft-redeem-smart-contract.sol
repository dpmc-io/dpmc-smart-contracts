// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

interface INFE721 {
    function tokenValue(uint256 tokenId) external view returns (uint256);
}

contract REDEEM is IERC721Receiver, Ownable(msg.sender), ReentrancyGuard, ERC165 {
    using SafeERC20 for IERC20;

    address public erc721token;
    address public erc20token;
    address public PAYOUT;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    mapping (address => bool) public isAddressBlacklisted;
    mapping (address => bool) public isAdmin;
    bool public isRedeemable;
    mapping (address => mapping(uint256 => bool)) public isTokenIdBlacklisted;

    event Redeem(address indexed nfe, address indexed lastOwner, uint256 indexed tokenId, uint256 mniValue, uint256 timeStamp);
    event BlacklistedAddress(address indexed user, bool isBlacklisted, uint256 timeStamp);
    event BlacklistedNfe(uint256 indexed tokenId, bool isBlacklisted, uint256 timeStamp);
    event SetIsRedeemable(bool isRedeemable);
    event AddOrRemoveAdmin(address indexed admin, bool isAdmin);
    event UpdateBlacklistedAddress(address indexed user, bool isBlacklisted);
    event UpdateBlacklistedTokenId(uint256 indexed tokenId, bool isBlacklisted);
    event UpdateNFEaddress(address indexed newAddress);
    event UpdateDPMCaddress(address indexed newAddress);
    event UpdatePayoutAddress(address indexed newAddress);

    constructor() {
        erc721token = 0x4D67bb397810e4E790b5E5fac44bB495F54C20D3;
        erc20token = 0x0c24C252d7C63891C2c7C74cE8fb2a35Ea693c08;
        PAYOUT = 0x73d004D298627140afcBe5F62A235ea188534742;
        isRedeemable = true;

        emit UpdateNFEaddress(erc721token);
        emit UpdateDPMCaddress(erc20token);
        emit UpdatePayoutAddress(PAYOUT);
        emit SetIsRedeemable(isRedeemable);
    }

    function onERC721Received(address, address from, uint256 tokenId, bytes memory) public override returns (bytes4) {
        emit Redeem(erc721token, from, tokenId, 0, block.timestamp);
        return this.onERC721Received.selector;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == owner(), "Only the admin or owner address can perform this action.");
        _;
    }

    function setIsRedeemable(bool _isRedeemable) public onlyAdmin {
        isRedeemable = _isRedeemable;
        emit SetIsRedeemable(_isRedeemable);
    }

    function addOrRemoveAdmin(address _admin, bool _isAdmin) public onlyOwner {
        isAdmin[_admin] = _isAdmin;
        emit AddOrRemoveAdmin(_admin, _isAdmin);
    }

    function updateBlacklistedAddress(address _user, bool _isBlacklisted) public onlyAdmin {
        isAddressBlacklisted[_user] = _isBlacklisted;
        emit UpdateBlacklistedAddress(_user, _isBlacklisted);
    }

    function updateBlacklistedTokenId(uint256 tokenId, bool _isBlacklisted) public onlyAdmin {
        isTokenIdBlacklisted[erc721token][tokenId] = _isBlacklisted;
        emit UpdateBlacklistedTokenId(tokenId, _isBlacklisted);
    }

    function updateNFEaddress(address _address) public onlyOwner {
        erc721token = _address;
        emit UpdateNFEaddress(_address);
    }

    function updateDPMCaddress(address _address) public onlyOwner {
        erc20token = _address;
        emit UpdateDPMCaddress(_address);
    }

    function updatePayoutAddress(address _address) public onlyOwner {
        PAYOUT = _address;
        emit UpdatePayoutAddress(_address);
    }

    function redeem(uint256 tokenId) public nonReentrant {
        require(isRedeemable, "R1: erc721token is not redeemable yet.");
        require(!isAddressBlacklisted[msg.sender], "R2: User address is blacklisted");
        require(!isTokenIdBlacklisted[erc721token][tokenId], "R3: This tokenID is blacklisted");
        require(IERC721(erc721token).ownerOf(tokenId) == msg.sender, "R4: You do not own this token");
        require(IERC721(erc721token).isApprovedForAll(msg.sender, address(this)), "R5: Contract must be approved");

        INFE721 NFECERT = INFE721(erc721token);
        uint256 tokenValue = NFECERT.tokenValue(tokenId);

        IERC721(erc721token).safeTransferFrom(msg.sender, DEAD, tokenId);
        require(IERC20(erc20token).balanceOf(PAYOUT) >= tokenValue, "Insufficient payout balance");
        require(IERC20(erc20token).allowance(PAYOUT, address(this)) >= tokenValue, "Insufficient payout allowance");
        IERC20(erc20token).safeTransferFrom(PAYOUT, msg.sender, tokenValue);

        emit Redeem(erc721token, msg.sender, tokenId, tokenValue, block.timestamp);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}

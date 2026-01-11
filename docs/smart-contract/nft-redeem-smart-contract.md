# REDEEM Contract Documentation

## Overview
- Receives ERC721 certificate NFTs and burns them to the DEAD address.
- Pays out ERC20 tokens from a designated PAYOUT pool equal to the NFT’s tokenValue.
- Includes admin-managed blacklists and toggles for redeemability.

## Storage
- erc721token: NFT contract (CERTIFICATE) address
- erc20token: ERC20 payment token (DPMC) address
- PAYOUT: payout address holding ERC20 funds
- DEAD: constant burn address for NFTs
- isAddressBlacklisted[address]: blacklist for users
- isAdmin[address]: admin set
- isRedeemable: global toggle to enable/disable redeem
- isTokenIdBlacklisted[erc721][tokenId]: blacklist individual NFTs

## Events
- Redeem(address nfe, address lastOwner, uint256 tokenId, uint256 mniValue, uint256 timeStamp)
- BlacklistedAddress(address user, bool isBlacklisted, uint256 timeStamp)
- BlacklistedNfe(uint256 tokenId, bool isBlacklisted, uint256 timeStamp)
- SetIsRedeemable(bool isRedeemable)
- AddOrRemoveAdmin(address admin, bool isAdmin)
- UpdateBlacklistedAddress(address user, bool isBlacklisted)
- UpdateBlacklistedTokenId(uint256 tokenId, bool isBlacklisted)
- UpdateNFEaddress(address newAddress)
- UpdateDPMCaddress(address newAddress)
- UpdatePayoutAddress(address newAddress)

## Constructor
### constructor()
- Initializes default addresses and sets isRedeemable=true.
- Emits UpdateNFEaddress, UpdateDPMCaddress, UpdatePayoutAddress, SetIsRedeemable.

## ERC721 Receiver
### onERC721Received(address, address from, uint256 tokenId, bytes) public override returns (bytes4)
- Emits Redeem event with mniValue=0 for receipt tracking.
- Returns selector to accept transfer.

## Modifiers
### onlyAdmin
- Requires msg.sender is in isAdmin or is owner().

## Admin/Owner Controls
### setIsRedeemable(bool _isRedeemable) public onlyAdmin
- Toggles global redeem flag and emits SetIsRedeemable.

### addOrRemoveAdmin(address _admin, bool _isAdmin) public onlyOwner
- Manages admin set and emits AddOrRemoveAdmin.

### updateBlacklistedAddress(address _user, bool _isBlacklisted) public onlyAdmin
- Updates isAddressBlacklisted and emits UpdateBlacklistedAddress.

### updateBlacklistedTokenId(uint256 tokenId, bool _isBlacklisted) public onlyAdmin
- Updates isTokenIdBlacklisted for erc721token and emits UpdateBlacklistedTokenId.

### updateNFEaddress(address _address) public onlyOwner
### updateDPMCaddress(address _address) public onlyOwner
### updatePayoutAddress(address _address) public onlyOwner
- Updates contract addresses for NFT, ERC20, and payout, emitting corresponding events.

## Redeem Flow
### redeem(uint256 tokenId) public nonReentrant
- Preconditions:
  - isRedeemable == true
  - msg.sender not blacklisted
  - tokenId not blacklisted
  - msg.sender is ownerOf(tokenId)
  - Contract isApprovedForAll by msg.sender
- Steps:
  - Reads tokenValue from NFT contract via INFE721.tokenValue(tokenId)
  - Transfers NFT from msg.sender to DEAD (burn)
  - Checks PAYOUT has sufficient ERC20 balance and allowance to cover tokenValue
  - Transfers ERC20 from PAYOUT to msg.sender via safeTransferFrom
  - Emits Redeem with the tokenValue paid

## ERC165
### supportsInterface(bytes4 interfaceId) public view override returns (bool)
- Supports IERC721Receiver and inherited interfaces.

## Function Details
- setIsRedeemable(bool _isRedeemable)
  - Purpose: Toggle global redeem availability.
  - Access: onlyAdmin.
  - Emits: SetIsRedeemable.
- Source: [nft-redeem-smart-contract.sol:L79-L83](contracts/nft-redeem-smart-contract.sol#L79-L83)
- addOrRemoveAdmin(address _admin, bool _isAdmin)
  - Purpose: Manage admin set.
  - Access: onlyOwner.
  - Emits: AddOrRemoveAdmin.
- Source: [nft-redeem-smart-contract.sol:L85-L87](contracts/nft-redeem-smart-contract.sol#L85-L87)
- updateBlacklistedAddress(address _user, bool _isBlacklisted)
  - Purpose: Update address blacklist.
  - Access: onlyAdmin.
  - Emits: UpdateBlacklistedAddress.
- Source: [nft-redeem-smart-contract.sol:L89-L93](contracts/nft-redeem-smart-contract.sol#L89-L93)
- updateBlacklistedTokenId(uint256 tokenId, bool _isBlacklisted)
  - Purpose: Blacklist/unblacklist specific NFT tokenId.
  - Access: onlyAdmin.
  - Emits: UpdateBlacklistedTokenId.
- Source: [nft-redeem-smart-contract.sol:L95-L99](contracts/nft-redeem-smart-contract.sol#L95-L99)
- updateNFEaddress(address _address), updateDPMCaddress(address _address), updatePayoutAddress(address _address)
  - Purpose: Configure NFT, ERC20, and payout addresses.
  - Access: onlyOwner.
  - Emits: UpdateNFEaddress / UpdateDPMCaddress / UpdatePayoutAddress.
- Source: [nft-redeem-smart-contract.sol:L101-L116](contracts/nft-redeem-smart-contract.sol#L101-L116)
- onERC721Received(address, address from, uint256 tokenId, bytes)
  - Purpose: Accept transferred NFTs; log receipt.
  - Access: public override.
  - Emits: Redeem(nfe, from, tokenId, mniValue=0, timeStamp).
- Source: [nft-redeem-smart-contract.sol:L61-L64](contracts/nft-redeem-smart-contract.sol#L61-L64)
- redeem(uint256 tokenId)
  - Purpose: Burn NFT and pay its tokenValue in ERC20 to owner.
  - Access: public nonReentrant.
  - Emits: Redeem(nfe, owner, tokenId, mniValue, timeStamp).
  - Requirements: isRedeemable; sender not blacklisted; token not blacklisted; sender owns token; PAYOUT balance and allowance sufficient.
- Source: [nft-redeem-smart-contract.sol:L117-L139](contracts/nft-redeem-smart-contract.sol#L117-L139)
- supportsInterface(bytes4 interfaceId)
  - Purpose: Advertise IERC721Receiver support.
  - Access: public view override.
- Source: [nft-redeem-smart-contract.sol:L115-L116](contracts/nft-redeem-smart-contract.sol#L115-L116)

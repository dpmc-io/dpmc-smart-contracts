# CERTIFICATE (NFT Minting) Contract Documentation

## Overview
- ERC721 NFT that represents a certificate backed by an ERC20 payment token.
- Mint is gated by an off-chain signer and payment transfer to a pool.
- Metadata is on-chain SVG, encoded in tokenURI.
- Transfer can be restricted except for allowed addresses and system flows.

## Storage
- tokenCounter: sequential token id starting from 1
- _name, _symbol: NFT collection metadata
- web, footer, description: display strings for SVG metadata
- maxOwnership: cap per wallet; 0 means unlimited
- signer: EOA used to authorize mint via signature
- paymentToken: ERC20 used to pay for mint
- paymentPool: destination for ERC20 payment
- redeem: REDEEM contract address (for integrations)
- staking: STAKE contract address (for integrations)
- minToMint, maxToMint: ERC20 payment constraints; 0 max means unlimited
- DEAD: burn address used by REDEEM flow
- isTransferRestricted: global transfer restriction flag
- paused: global pause
- allowedAddresses[address]: transfer whitelist
- _tokenExists[tokenId]: creation guard
- tokenValue[tokenId]: ERC20 payment value recorded on mint
- timeStamp[tokenId]: block timestamp stored on mint
- ownershipCount[address]: number of NFTs owned by address
- usedSig[bytes]: prevent signature reuse
- isAdmin[address]: admin set

## Events
- AdminUpdated(address admin, bool isAdmin)
- Paused(address account)
- Unpaused(address account)
- AllowedAddressUpdated(address allowedAddress, bool isAllowed)
- PaymentTokenAddressUpdated(address previousValue, address newValue)
- PaymentPoolAddressUpdated(address previousValue, address newValue)
- RedeemUpdated(address previousValue, address newValue)
- StakingUpdated(address previousValue, address newValue)
- MintParameterUpdated(string parameterType, uint256 previousValue, uint256 newValue)
- TransferRestrictionUpdated(bool previousValue, bool newValue)

## Modifiers
- onlyAdmin: admin or owner
- whenNotPaused: requires paused == false
- whenPaused: requires paused == true
- whenNotRestricted(address from, address to): transfer allowed if not restricted, minting (from==0) or to is allowed
- whenNotRestrictedExecutedFrom(address executedFrom): allowed if not restricted or executedFrom is staking or redeem

## Constructor
### constructor() Ownable(msg.sender) ERC721(_name, _symbol)
- Initializes signer, paymentToken, paymentPool, minToMint (default 100 ERC20 units), maxToMint=0 (unlimited), paused=false, isTransferRestricted=true.

## Admin Management
### addOrRemoveAdmin(address _admin, bool _true) public onlyOwner
- Grants/revokes admin rights.

## Parameters and Integrations
### updateMaxOwnership(uint256 newValue) public onlyAdmin
- Updates wallet-level ownership cap.

### pause() external onlyAdmin
### unpause() external onlyAdmin
- Toggles global pause.

### updatePaymentToken(address newPaymentToken) external onlyAdmin
### updatePaymentPool(address newPaymentPool) external onlyAdmin
- Updates ERC20 payment token and pool addresses, emitting the previous/new values.

### updateRedeem(address newRedeem) external onlyAdmin
### updateStaking(address newStaking) external onlyAdmin
- Sets integration addresses for redeem/staking flows.

### updateMinMintAmount(uint256 newValue) external onlyAdmin
- Requires maxToMint == 0 or newValue ≤ maxToMint; sets minToMint.

### updateMaxMintAmount(uint256 newValue) external onlyAdmin
- Requires newValue == 0 or newValue ≥ minToMint; sets maxToMint.

### setAllowedAddress(address allowedAddress) external onlyAdmin
### updateAllowedAddress(address oldAddress, address newAddress) external onlyAdmin
### removeAllowedAddress(address addressToRemove) external onlyAdmin
- Manages allowed addresses for restricted transfers.

### updateTransferRestriction(bool isRestricted) external onlyAdmin
- Toggles isTransferRestricted.

## Signature Utilities
### splitSignature(bytes sig) internal pure returns (uint8, bytes32, bytes32)
- Parses 65-byte ECDSA signatures into v, r, s.

### recoverSigner(bytes32 _hashedMessage, bytes sig) internal pure returns (address)
- Returns the signer of the hashed message using ecrecover.

## Minting
### mint(uint256 value, address _address, uint256 _exp, bytes _sig) public whenNotPaused nonReentrant
- Enforces signature one-time use and expiry.
- Validates signer against keccak256(abi.encodePacked(_address, _exp)).
- Enforces ownership cap, ERC20 balance, min/max constraints, and allowance.
- Transfers ERC20 payment to paymentPool and mints NFT to msg.sender.
- Sets tokenValue and timeStamp; increments tokenCounter; marks signature used.

## Transfers
### transfer(address to, uint256 tokenId) public whenNotPaused whenNotRestricted(msg.sender, to) nonReentrant
- Standard transfer gated by restriction logic.

### transferFrom(address from, address to, uint256 tokenId) public override whenNotPaused whenNotRestrictedExecutedFrom(msg.sender) nonReentrant
- If executed by redeem, decrements ownership count for sender.
- Performs transfer respecting restriction execution source.

## Metadata
### tokenURI(uint256 tokenId) public view override returns (string)
- Returns Base64-encoded JSON containing name, description, image, animation_url, and attributes.
- Image is an SVG composed from internal parts.

### getSvg(uint256 tokenId) public view returns (string)
- Builds the JSON metadata and returns Base64 of the JSON.

### partOne() internal pure returns (string)
### partTwo() internal view returns (string)
### partThree(uint256 tokenId) internal view returns (string)
### partFour(uint256 tokenId) internal view returns (string)
- SVG assembly helpers for the certificate visual.

### generateImage(uint256 tokenId) internal view returns (string)
- Concatenates SVG parts.

### generateDateTime(uint256 tokenId) internal view returns (string)
- Formats timeStamp[tokenId] into YYYY/MM/DD HH:MM:SS.

### generateAttributes(uint256 tokenId) internal view returns (string)
- Encodes attributes for token value and timestamp.

## Function Details
- addOrRemoveAdmin(address _admin, bool _true)
  - Purpose: Manage admin set.
  - Access: onlyOwner.
  - Emits: AdminUpdated.
  - Source: [nft-minting-smart-contract.sol:L363-L367](contracts/nft-minting-smart-contract.sol#L363-L367)
- updateMaxOwnership(uint256 newValue)
  - Purpose: Set max NFTs per wallet.
  - Access: onlyAdmin.
  - Emits: MintParameterUpdated("MaxOwnership", old, new).
  - Source: [nft-minting-smart-contract.sol:L368-L373](contracts/nft-minting-smart-contract.sol#L368-L373)
- pause(), unpause()
  - Purpose: Global pause control.
  - Access: onlyAdmin.
  - Emits: Paused / Unpaused.
  - Source: [nft-minting-smart-contract.sol:L374-L385](contracts/nft-minting-smart-contract.sol#L374-L385)
- updatePaymentToken(address newPaymentToken)
  - Purpose: Set ERC20 payment token.
  - Access: onlyAdmin.
  - Emits: PaymentTokenAddressUpdated(old, new).
  - Source: [nft-minting-smart-contract.sol:L386-L391](contracts/nft-minting-smart-contract.sol#L386-L391)
- updatePaymentPool(address newPaymentPool)
  - Purpose: Set payment destination pool.
  - Access: onlyAdmin.
  - Emits: PaymentPoolAddressUpdated(old, new).
  - Source: [nft-minting-smart-contract.sol:L391-L395](contracts/nft-minting-smart-contract.sol#L391-L395)
- updateRedeem(address newRedeem), updateStaking(address newStaking)
  - Purpose: Configure integrations.
  - Access: onlyAdmin.
  - Emits: RedeemUpdated / StakingUpdated.
  - Source: [nft-minting-smart-contract.sol:L396-L405](contracts/nft-minting-smart-contract.sol#L396-L405)
- updateMinMintAmount(uint256 newValue)
  - Purpose: Set minimum payment value.
  - Access: onlyAdmin.
  - Emits: MintParameterUpdated("MinMintAmount", old, new).
  - Requirements: maxToMint == 0 or newValue ≤ maxToMint.
  - Source: [nft-minting-smart-contract.sol:L406-L415](contracts/nft-minting-smart-contract.sol#L406-L415)
- updateMaxMintAmount(uint256 newValue)
  - Purpose: Set maximum payment value (0 = unlimited).
  - Access: onlyAdmin.
  - Emits: MintParameterUpdated("MaxMintAmount", old, new).
  - Requirements: newValue == 0 or newValue ≥ minToMint.
  - Source: [nft-minting-smart-contract.sol:L416-L425](contracts/nft-minting-smart-contract.sol#L416-L425)
- setAllowedAddress(address allowedAddress), updateAllowedAddress(address oldAddress, address newAddress), removeAllowedAddress(address addressToRemove)
  - Purpose: Manage transfer whitelist under restriction mode.
  - Access: onlyAdmin.
  - Emits: AllowedAddressUpdated.
  - Source: [nft-minting-smart-contract.sol:L426-L451](contracts/nft-minting-smart-contract.sol#L426-L451)
- updateTransferRestriction(bool isRestricted)
  - Purpose: Toggle global transfer restriction.
  - Access: onlyAdmin.
  - Emits: TransferRestrictionUpdated.
  - Source: [nft-minting-smart-contract.sol:L451-L455](contracts/nft-minting-smart-contract.sol#L451-L455)
- mint(uint256 value, address _address, uint256 _exp, bytes _sig)
  - Purpose: Mint certificate after signature and payment verification.
  - Parameters: value (ERC20 amount), _address, _exp (expiry), _sig (ECDSA).
  - Access: public whenNotPaused nonReentrant.
  - Emits: Transfer (ERC20), ERC721 Transfer.
  - Requirements: unused signature; valid signer; ownership cap; balance/allowance; min/max constraints.
  - Source: [nft-minting-smart-contract.sol:L456-L500](contracts/nft-minting-smart-contract.sol#L456-L500)
- transfer(address to, uint256 tokenId)
  - Purpose: Standard ERC721 transfer with restriction checks.
  - Access: public whenNotPaused whenNotRestricted nonReentrant.
  - Source: [nft-minting-smart-contract.sol:L500-L506](contracts/nft-minting-smart-contract.sol#L500-L506)
- transferFrom(address from, address to, uint256 tokenId)
  - Purpose: Delegated transfer respecting restriction execution source.
  - Access: public override whenNotPaused whenNotRestrictedExecutedFrom nonReentrant.
  - Source: [nft-minting-smart-contract.sol:L507-L523](contracts/nft-minting-smart-contract.sol#L507-L523)
- tokenURI(uint256 tokenId)
  - Purpose: Return on-chain JSON metadata with SVG image.
  - Access: public view override.
  - Source: [nft-minting-smart-contract.sol:L524-L531](contracts/nft-minting-smart-contract.sol#L524-L531)
- partOne(), partTwo(), partThree(uint256 tokenId), partFour(uint256 tokenId)
  - Purpose: Build SVG parts for image.
  - Access: internal (pure/view).
  - Source: [nft-minting-smart-contract.sol:L532-L609](contracts/nft-minting-smart-contract.sol#L532-L609)
- generateImage(uint256 tokenId)
  - Purpose: Concatenate SVG parts.
  - Access: internal view.
  - Source: [nft-minting-smart-contract.sol:L610-L623](contracts/nft-minting-smart-contract.sol#L610-L623)
- generateDateTime(uint256 tokenId)
  - Purpose: Format timestamp components.
  - Access: internal view.
  - Source: [nft-minting-smart-contract.sol:L624-L735](contracts/nft-minting-smart-contract.sol#L624-L735)
- generateAttributes(uint256 tokenId)
  - Purpose: Encode attributes as JSON string parts.
  - Access: internal view.
  - Source: [nft-minting-smart-contract.sol:L721-L735](contracts/nft-minting-smart-contract.sol#L721-L735)
- getSvg(uint256 tokenId)
  - Purpose: Build full metadata JSON and return Base64.
  - Access: public view.
  - Source: [nft-minting-smart-contract.sol:L736-L767](contracts/nft-minting-smart-contract.sol#L736-L767)

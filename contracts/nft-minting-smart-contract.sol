// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

library BokkyPooBahsDateTimeLibrary {
    uint constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint constant SECONDS_PER_HOUR = 60 * 60;
    uint constant SECONDS_PER_MINUTE = 60;
    int constant OFFSET19700101 = 2440588;

    uint constant DOW_MON = 1;
    uint constant DOW_TUE = 2;
    uint constant DOW_WED = 3;
    uint constant DOW_THU = 4;
    uint constant DOW_FRI = 5;
    uint constant DOW_SAT = 6;
    uint constant DOW_SUN = 7;

    // ------------------------------------------------------------------------
    // Calculate the number of days from 1970/01/01 to year/month/day using
    // the date conversion algorithm from
    //   https://aa.usno.navy.mil/faq/JD_formula.html
    // and subtracting the offset 2440588 so that 1970/01/01 is day 0
    //
    // days = day
    //      - 32075
    //      + 1461 * (year + 4800 + (month - 14) / 12) / 4
    //      + 367 * (month - 2 - (month - 14) / 12 * 12) / 12
    //      - 3 * ((year + 4900 + (month - 14) / 12) / 100) / 4
    //      - offset
    // ------------------------------------------------------------------------
    function _daysFromDate(
        uint year,
        uint month,
        uint day
    ) internal pure returns (uint _days) {
        require(year >= 1970);
        int _year = int(year);
        int _month = int(month);
        int _day = int(day);

        int __days = _day -
            32075 +
            (1461 * (_year + 4800 + (_month - 14) / 12)) /
            4 +
            (367 * (_month - 2 - ((_month - 14) / 12) * 12)) /
            12 -
            (3 * ((_year + 4900 + (_month - 14) / 12) / 100)) /
            4 -
            OFFSET19700101;

        _days = uint(__days);
    }

    // ------------------------------------------------------------------------
    // Calculate year/month/day from the number of days since 1970/01/01 using
    // the date conversion algorithm from
    //   http://aa.usno.navy.mil/faq/docs/JD_Formula.php
    // and adding the offset 2440588 so that 1970/01/01 is day 0
    //
    // int L = days + 68569 + offset
    // int N = 4 * L / 146097
    // L = L - (146097 * N + 3) / 4
    // year = 4000 * (L + 1) / 1461001
    // L = L - 1461 * year / 4 + 31
    // month = 80 * L / 2447
    // dd = L - 2447 * month / 80
    // L = month / 11
    // month = month + 2 - 12 * L
    // year = 100 * (N - 49) + year + L
    // ------------------------------------------------------------------------
    function _daysToDate(
        uint _days
    ) internal pure returns (uint year, uint month, uint day) {
        int __days = int(_days);

        int L = __days + 68569 + OFFSET19700101;
        int N = (4 * L) / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = (4000 * (L + 1)) / 1461001;
        L = L - (1461 * _year) / 4 + 31;
        int _month = (80 * L) / 2447;
        int _day = L - (2447 * _month) / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;

        year = uint(_year);
        month = uint(_month);
        day = uint(_day);
    }

    function getYear(uint timestamp) internal pure returns (uint year) {
        (year, , ) = _daysToDate(timestamp / SECONDS_PER_DAY);
    }

    function getMonth(uint timestamp) internal pure returns (uint month) {
        (, month, ) = _daysToDate(timestamp / SECONDS_PER_DAY);
    }

    function getDay(uint timestamp) internal pure returns (uint day) {
        (, , day) = _daysToDate(timestamp / SECONDS_PER_DAY);
    }

    function getHour(uint timestamp) internal pure returns (uint hour) {
        uint secs = timestamp % SECONDS_PER_DAY;
        hour = secs / SECONDS_PER_HOUR;
    }

    function getMinute(uint timestamp) internal pure returns (uint minute) {
        uint secs = timestamp % SECONDS_PER_HOUR;
        minute = secs / SECONDS_PER_MINUTE;
    }

    function getSecond(uint timestamp) internal pure returns (uint second) {
        second = timestamp % SECONDS_PER_MINUTE;
    }
}

library WeiToString {
    using Strings for uint256;

    function utfStringLength(
        string memory str
    ) internal pure returns (uint length) {
        uint i = 0;
        bytes memory string_rep = bytes(str);

        while (i < string_rep.length) {
            if (string_rep[i] >> 7 == 0) i += 1;
            else if (string_rep[i] >> 5 == bytes1(uint8(0x6))) i += 2;
            else if (string_rep[i] >> 4 == bytes1(uint8(0xE))) i += 3;
            else if (string_rep[i] >> 3 == bytes1(uint8(0x1E)))
                i += 4;
                //For safety
            else i += 1;

            length++;
        }
    }

    function substring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function weiToString(
        uint256 decimalPlaces,
        uint256 numerator
    ) internal pure returns (string memory result) {
        uint256 factor = 10 ** decimalPlaces;
        uint256 quotient = numerator / (10 ** decimalPlaces);
        bool rounding = 2 * ((numerator * factor) % (10 ** decimalPlaces)) >=
            10 ** decimalPlaces;
        uint256 remainder = ((numerator * factor) / 10 ** decimalPlaces) %
            factor;
        if (rounding) {
            remainder += 1;
        }
        string memory result_ = string(
            abi.encodePacked(
                quotient.toString(),
                ".",
                WeiToString.numToFixedLengthStr(decimalPlaces, remainder)
            )
        );
        uint256 bigNum = numerator / factor;
        uint256 bigNumLength = utfStringLength(bigNum.toString());
        result = numerator < factor
            ? substring(result_, 0, 5)
            : substring(result_, 0, bigNumLength + 5);
    }

    function numToFixedLengthStr(
        uint256 decimalPlaces,
        uint256 num
    ) internal pure returns (string memory result) {
        bytes memory byteString;
        for (uint256 i = 0; i < decimalPlaces; i++) {
            uint256 remainder = num % 10;
            byteString = abi.encodePacked(remainder.toString(), byteString);
            num = num / 10;
        }
        result = string(byteString);
    }
}

interface IERC20 {
    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function balanceOf(address who) external view returns (uint256 balance);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256 remaining);

    function transfer(
        address to,
        uint256 value
    ) external returns (bool success);

    function approve(
        address spender,
        uint256 value
    ) external returns (bool success);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool success);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}

contract CERTIFICATE is ERC721, Ownable, ReentrancyGuard {
    uint256 public tokenCounter = 1;
    string private _name = "NFT CERTIFICATE";
    string private _symbol = "DPMC";
    string private web = "DPMC.IO";
    string private footer = "NFT Contract Address";
    string private description = "DPMC NFT Certificate issued by DPMC.IO";
    uint256 public maxOwnership = 5;

    address public signer;
    address public paymentToken;
    address public paymentPool;
    address public redeem;
    address public staking;
    uint256 public minToMint;
    uint256 public maxToMint;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;
    bool public isTransferRestricted;
    bool public paused;

    mapping(address => bool) public allowedAddresses;
    mapping(uint256 => bool) private _tokenExists;
    mapping(uint256 => uint256) public tokenValue;
    mapping(uint256 => uint256) public timeStamp;
    mapping(address => uint256) public ownershipCount;
    mapping(bytes => bool) public usedSig;
    mapping(address => bool) public isAdmin;

    event AdminUpdated(address admin, bool isAdmin);
    event Paused(address account);
    event Unpaused(address account);
    event AllowedAddressUpdated(address allowedAddress, bool isAllowed);
    event PaymentTokenAddressUpdated(address previousValue, address newValue);
    event PaymentPoolAddressUpdated(address previousValue, address newValue);
    event RedeemUpdated(address previousValue, address newValue);
    event StakingUpdated(address previousValue, address newValue);
    event MintParameterUpdated(
        string parameterType,
        uint256 previousValue,
        uint256 newValue
    );
    event TransferRestrictionUpdated(bool previousValue, bool newValue);

    // Modifier to check if a token transfer is restricted
    modifier whenNotRestricted(address from, address to) {
        // Condition: Check if the contract is not in a restricted state
        // or if the transfer is from the zero address (minting operation)
        // or if the 'to' address is in the list of allowed addresses.
        require(
            !isTransferRestricted || // Condition 1: Contract not in a restricted state
                from == address(0) || // Condition 2: Transfer from the zero address (minting)
                allowedAddresses[to], // Condition 3: 'to' address is in the list of allowed addresses
            "Token transfer is restricted" // Error message if the conditions are not met
        );
        _; // Placeholder for the modified function's body
    }

    // Modifier to check if a token transfer is allowed based on contract execution
    modifier whenNotRestrictedExecutedFrom(address executedFrom) {
        // Conditions:
        // 1. Ensure the contract is not in a restricted state
        // 2. Validate that the token transfer is executed from an authorized source, such as staking or redeem addresses
        require(
            !isTransferRestricted || // Condition 1: Contract is not in a restricted state
                executedFrom == staking ||
                executedFrom == redeem, // Condition 2: 'executedFrom' address should be staking or redeem address
            "Token transfer is restricted" // Error message if the conditions are not met
        );
        _; // Placeholder for the modified function's body
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    constructor() Ownable(msg.sender) ERC721(_name, _symbol) {
        signer = 0x143e5C4160Eaef1c01251D23F2A04F0b3e9d6c10;
        paymentToken = 0xb63683C2d9563C25F65793164a282eF82C0A03F6;
        paymentPool = 0x900c6f8AAcd4AA70F1477Be27CcbbD4bf9CC011E;
        minToMint = 100000000000000000000;
        maxToMint = 0; // 0 means unlimited
        paused = false;
        isTransferRestricted = true;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == owner(), "Admin only");
        _;
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(
        bytes32 _hashedMessage,
        bytes memory sig
    ) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(_hashedMessage, v, r, s);
    }

    function addOrRemoveAdmin(address _admin, bool _true) public onlyOwner {
        isAdmin[_admin] = _true;
        emit AdminUpdated(_admin, _true);
    }

    function updateMaxOwnership(uint256 newValue) public onlyAdmin {
        uint256 oldValue = maxOwnership;
        maxOwnership = newValue;
        emit MintParameterUpdated("MaxOwnership", oldValue, newValue);
    }

    function pause() external onlyAdmin {
        require(!paused, "Contract is already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyAdmin {
        require(paused, "Contract is not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    function updatePaymentToken(address newPaymentToken) external onlyAdmin {
        emit PaymentTokenAddressUpdated(paymentToken, newPaymentToken);
        paymentToken = newPaymentToken;
    }

    function updatePaymentPool(address newPaymentPool) external onlyAdmin {
        emit PaymentPoolAddressUpdated(paymentPool, newPaymentPool);
        paymentPool = newPaymentPool;
    }

    function updateRedeem(address newRedeem) external onlyAdmin {
        emit RedeemUpdated(redeem, newRedeem);
        redeem = newRedeem;
    }

    function updateStaking(address newStaking) external onlyAdmin {
        emit StakingUpdated(staking, newStaking);
        staking = newStaking;
    }

    function updateMinMintAmount(uint256 newValue) external onlyAdmin {
        require(
            maxToMint == 0 || newValue <= maxToMint,
            "minToMint cannot exceed maxToMint"
        );

        emit MintParameterUpdated("MinMintAmount", minToMint, newValue);
        minToMint = newValue;
    }

    function updateMaxMintAmount(uint256 newValue) external onlyAdmin {
        require(
            newValue == 0 || newValue >= minToMint,
            "maxToMint must be zero (unlimited) or greater than minToMint"
        );

        emit MintParameterUpdated("MaxMintAmount", maxToMint, newValue);
        maxToMint = newValue;
    }

    function setAllowedAddress(address allowedAddress) external onlyAdmin {
        allowedAddresses[allowedAddress] = true;
        emit AllowedAddressUpdated(allowedAddress, true);
    }

    function updateAllowedAddress(
        address oldAddress,
        address newAddress
    ) external onlyAdmin {
        require(allowedAddresses[oldAddress], "Old address is not allowed");
        allowedAddresses[oldAddress] = false;
        allowedAddresses[newAddress] = true;
        emit AllowedAddressUpdated(oldAddress, false);
        emit AllowedAddressUpdated(newAddress, true);
    }

    function removeAllowedAddress(address addressToRemove) external onlyAdmin {
        require(
            allowedAddresses[addressToRemove],
            "Address to remove is not allowed"
        );
        allowedAddresses[addressToRemove] = false;
        emit AllowedAddressUpdated(addressToRemove, false);
    }

    function updateTransferRestriction(bool isRestricted) external onlyAdmin {
        emit TransferRestrictionUpdated(isTransferRestricted, isRestricted);
        isTransferRestricted = isRestricted;
    }

    function mint(
        uint256 value,
        address _address,
        uint256 _exp,
        bytes memory _sig
    ) public whenNotPaused nonReentrant {
        require(!usedSig[_sig], "Signature already used");
        bytes32 _hashedMessage = keccak256(abi.encodePacked(_address, _exp));
        require(
            recoverSigner(_hashedMessage, _sig) == signer,
            "Invalid signer"
        );
        IERC20 ERC20 = IERC20(paymentToken);
        require(
            maxOwnership == 0 || ownershipCount[msg.sender] < maxOwnership,
            "Max ownership reached"
        );
        require(
            ERC20.balanceOf(msg.sender) >= value,
            "Insufficient token balance"
        );
        require(value >= minToMint, "Insufficient token amount");
        require(
            maxToMint == 0 || value <= maxToMint,
            "Exceeds maximum mintable amount"
        );
        require(
            ERC20.allowance(msg.sender, address(this)) >= value,
            "Insufficient token allowance"
        );

        ERC20.transferFrom(msg.sender, paymentPool, value);
        _safeMint(msg.sender, tokenCounter);
        ownershipCount[msg.sender]++;

        // Set the token existence flag to true
        _tokenExists[tokenCounter] = true;

        tokenValue[tokenCounter] = value;
        timeStamp[tokenCounter] = block.timestamp;
        tokenCounter++;
        usedSig[_sig] = true;
    }

    function transfer(
        address to,
        uint256 tokenId
    ) public whenNotPaused whenNotRestricted(msg.sender, to) nonReentrant {
        super._transfer(msg.sender, to, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        override
        whenNotPaused
        whenNotRestrictedExecutedFrom(msg.sender)
        nonReentrant
    {
        if (msg.sender == redeem) {
            ownershipCount[from]--;
        }
        super._transfer(from, to, tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721) returns (string memory) {
        require(_tokenExists[tokenId], "Token does not exist");

        return getSvg(tokenId);
    }

    function partOne() internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<svg version="1.2" viewBox="0 0 400 600" width="300" height="450" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:bx="https://boxy-svg.com"><defs>',
                    '<linearGradient id="P" gradientUnits="userSpaceOnUse" />',
                    '<linearGradient id="g1" x1="200" y1="-164.7" x2="200" y2="764.7" xlink:href="#P">',
                    '<stop stop-color="#ff9933" offset="0.2" />',
                    '<stop offset="0.4" stop-color="#ff3399" />',
                    '<stop offset="0.9" stop-color="#0000ff" />',
                    "</linearGradient>",
                    '<style>*{font-family: Arial, sans-serif}</style>'
                )
            );
    }

    function partTwo() internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<linearGradient gradientUnits="userSpaceOnUse" x1="200.4" y1="58.098" x2="200.4" y2="137.486" id="gradient-1" spreadMethod="pad" gradientTransform="matrix(1, 0, 0, 1, -1.784318, -22.330008)">',
                    '<stop offset="0" style="stop-color: rgba(254, 0, 0, 1)" />',
                    '<stop offset="1" style="stop-color: rgba(152, 0, 0, 1)" />',
                    "</linearGradient></defs>",
                    "<style>.a {fill: url(#g1)}</style>",
                    '<path class="a" d="m6 11c0-3.9 3.1-7 7-7h374c3.9 0 7 3.1 7 7v578c0 3.9-3.1 7-7 7h-374c-3.9 0-7-3.1-7-7z" />',
                    '<text xmlns="http://www.w3.org/2000/svg" style="fill: rgb(255, 255, 255); font-family: &quot;Arial&quot;; font-size: 71px; font-weight: 700; white-space: pre;" x="200" y="100.271" text-anchor="middle" dominant-baseline="middle">',
                    _symbol,
                    "</text>",
                    '<text style="fill: rgb(255, 255, 255); font-family: Arial, sans-serif; font-size: 26px; font-weight: 700; white-space: pre;" x="200" y="166.33" text-anchor="middle">',
                    _name,
                    "</text>"
                )
            );
    }

    function partThree(uint256 tokenId) internal view returns (string memory) {
        IERC20 ERC20 = IERC20(paymentToken);
        return
            string(
                abi.encodePacked(
                    '<text xmlns="http://www.w3.org/2000/svg" y="196.315" x="200" style="fill: rgb(255, 255, 255); font-family: Arial, sans-serif; font-size: 21px; white-space: pre;" text-anchor="middle" dominant-baseline="middle">ID: ',
                    Strings.toString(tokenId),
                    "</text>",
                    '<rect x="60" y="259.282" width="280" height="41.852" style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" rx="15.109" ry="15.109" />',
                    '<rect x="60" y="313.601" width="280" height="41.852" style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" rx="15.109" ry="15.109" />',
                    '<text style="font-family: Arial, sans-serif; font-size: 18px; white-space: pre;" x="78.558" y="286.844">Value: ',
                    WeiToString.weiToString(
                        ERC20.decimals(),
                        tokenValue[tokenId]
                    ),
                    " ",
                    ERC20.symbol(),
                    "</text>"
                )
            );
    }

    function partFour(uint256 tokenId) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<text style="font-family: Arial, sans-serif; font-size: 18px; white-space: pre;" x="78.558" y="339.815">Minted: ',
                    generateDateTime(tokenId),
                    "</text>",
                    '<text style="fill: rgb(255, 255, 255); font-family: Arial, sans-serif; font-size: 18px; white-space: pre;" x="200" y="446.399" text-anchor="middle">',
                    footer,
                    "</text>",
                    '<text style="fill: rgb(255, 255, 255); font-family: Arial, sans-serif; font-size: 13px; white-space: pre;" x="200" y="470.902" text-anchor="middle" dominant-baseline="middle">',
                    Strings.toHexString(uint256(uint160(address(this))), 20),
                    "</text>",
                    '<text style="fill: rgb(255, 255, 255); font-family: Arial, sans-serif; font-size: 18px; white-space: pre;" x="200" y="562.619" text-anchor="middle">',
                    web,
                    "</text></svg>"
                )
            );
    }

    function generateImage(
        uint256 tokenId
    ) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    partOne(),
                    partTwo(),
                    partThree(tokenId),
                    partFour(tokenId)
                )
            );
    }

    function generateDateTime(
        uint256 tokenId
    ) internal view returns (string memory) {
        string memory month = BokkyPooBahsDateTimeLibrary.getMonth(
            timeStamp[tokenId]
        ) < 10
            ? string(
                abi.encodePacked(
                    "0",
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getMonth(timeStamp[tokenId])
                    )
                )
            )
            : Strings.toString(
                BokkyPooBahsDateTimeLibrary.getMonth(timeStamp[tokenId])
            );
        string memory day = BokkyPooBahsDateTimeLibrary.getDay(
            timeStamp[tokenId]
        ) < 10
            ? string(
                abi.encodePacked(
                    "0",
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getDay(timeStamp[tokenId])
                    )
                )
            )
            : Strings.toString(
                BokkyPooBahsDateTimeLibrary.getDay(timeStamp[tokenId])
            );
        string memory hour = BokkyPooBahsDateTimeLibrary.getHour(
            timeStamp[tokenId]
        ) < 10
            ? string(
                abi.encodePacked(
                    "0",
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getHour(timeStamp[tokenId])
                    )
                )
            )
            : Strings.toString(
                BokkyPooBahsDateTimeLibrary.getHour(timeStamp[tokenId])
            );
        string memory minute = BokkyPooBahsDateTimeLibrary.getMinute(
            timeStamp[tokenId]
        ) < 10
            ? string(
                abi.encodePacked(
                    "0",
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getMinute(
                            timeStamp[tokenId]
                        )
                    )
                )
            )
            : Strings.toString(
                BokkyPooBahsDateTimeLibrary.getMinute(timeStamp[tokenId])
            );
        string memory second = BokkyPooBahsDateTimeLibrary.getSecond(
            timeStamp[tokenId]
        ) < 10
            ? string(
                abi.encodePacked(
                    "0",
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getSecond(
                            timeStamp[tokenId]
                        )
                    )
                )
            )
            : Strings.toString(
                BokkyPooBahsDateTimeLibrary.getSecond(timeStamp[tokenId])
            );
        return
            string(
                abi.encodePacked(
                    Strings.toString(
                        BokkyPooBahsDateTimeLibrary.getYear(timeStamp[tokenId])
                    ),
                    "/",
                    month,
                    "/",
                    day,
                    " ",
                    hour,
                    ":",
                    minute,
                    ":",
                    second
                )
            );
    }

    function generateAttributes(
        uint256 tokenId
    ) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '"attributes": [{ "trait_type": "DPMC", "value": "',
                    Strings.toString(tokenValue[tokenId]),
                    '" },{"trait_type": "timeStamp", "value": "',
                    Strings.toString(timeStamp[tokenId]),
                    '"}]'
                )
            );
    }

    function getSvg(uint256 tokenId) public view returns (string memory) {
        string memory image = Base64.encode(bytes(generateImage(tokenId)));
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                " (#",
                                Strings.toString(tokenId),
                                ')", "description": "',
                                description,
                                '"',
                                ', "image": "',
                                "data:image/svg+xml;base64,",
                                image,
                                '", ',
                                '"animation_url": "',
                                "data:image/svg+xml;base64,",
                                image,
                                '", ',
                                generateAttributes(tokenId),
                                "}"
                            )
                        )
                    )
                )
            );
    }
}

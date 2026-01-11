// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

library Counters {
    struct Counter {
        // This variable should never be directly accessed by users of the library: interactions must be restricted to
        // the library's function. As of Solidity v0.5.2, this cannot be enforced, though there is a proposal to add
        // this feature: see https://github.com/ethereum/solidity/issues/4637
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }

    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}

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

    function timestampFromDate(
        uint year,
        uint month,
        uint day
    ) internal pure returns (uint timestamp) {
        timestamp = _daysFromDate(year, month, day) * SECONDS_PER_DAY;
    }

    function timestampFromDateTime(
        uint year,
        uint month,
        uint day,
        uint hour,
        uint minute,
        uint second
    ) internal pure returns (uint timestamp) {
        timestamp =
            _daysFromDate(year, month, day) *
            SECONDS_PER_DAY +
            hour *
            SECONDS_PER_HOUR +
            minute *
            SECONDS_PER_MINUTE +
            second;
    }

    function timestampToDate(
        uint timestamp
    ) internal pure returns (uint year, uint month, uint day) {
        (year, month, day) = _daysToDate(timestamp / SECONDS_PER_DAY);
    }

    function timestampToDateTime(
        uint timestamp
    )
        internal
        pure
        returns (
            uint year,
            uint month,
            uint day,
            uint hour,
            uint minute,
            uint second
        )
    {
        (year, month, day) = _daysToDate(timestamp / SECONDS_PER_DAY);
        uint secs = timestamp % SECONDS_PER_DAY;
        hour = secs / SECONDS_PER_HOUR;
        secs = secs % SECONDS_PER_HOUR;
        minute = secs / SECONDS_PER_MINUTE;
        second = secs % SECONDS_PER_MINUTE;
    }

    function isValidDate(
        uint year,
        uint month,
        uint day
    ) internal pure returns (bool valid) {
        if (year >= 1970 && month > 0 && month <= 12) {
            uint daysInMonth = _getDaysInMonth(year, month);
            if (day > 0 && day <= daysInMonth) {
                valid = true;
            }
        }
    }

    function isValidDateTime(
        uint year,
        uint month,
        uint day,
        uint hour,
        uint minute,
        uint second
    ) internal pure returns (bool valid) {
        if (isValidDate(year, month, day)) {
            if (hour < 24 && minute < 60 && second < 60) {
                valid = true;
            }
        }
    }

    function isLeapYear(uint timestamp) internal pure returns (bool leapYear) {
        (uint year, , ) = _daysToDate(timestamp / SECONDS_PER_DAY);
        leapYear = _isLeapYear(year);
    }

    function _isLeapYear(uint year) internal pure returns (bool leapYear) {
        leapYear = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
    }

    function isWeekDay(uint timestamp) internal pure returns (bool weekDay) {
        weekDay = getDayOfWeek(timestamp) <= DOW_FRI;
    }

    function isWeekEnd(uint timestamp) internal pure returns (bool weekEnd) {
        weekEnd = getDayOfWeek(timestamp) >= DOW_SAT;
    }

    function getDaysInMonth(
        uint timestamp
    ) internal pure returns (uint daysInMonth) {
        (uint year, uint month, ) = _daysToDate(timestamp / SECONDS_PER_DAY);
        daysInMonth = _getDaysInMonth(year, month);
    }

    function _getDaysInMonth(
        uint year,
        uint month
    ) internal pure returns (uint daysInMonth) {
        if (
            month == 1 ||
            month == 3 ||
            month == 5 ||
            month == 7 ||
            month == 8 ||
            month == 10 ||
            month == 12
        ) {
            daysInMonth = 31;
        } else if (month != 2) {
            daysInMonth = 30;
        } else {
            daysInMonth = _isLeapYear(year) ? 29 : 28;
        }
    }

    // 1 = Monday, 7 = Sunday
    function getDayOfWeek(
        uint timestamp
    ) internal pure returns (uint dayOfWeek) {
        uint _days = timestamp / SECONDS_PER_DAY;
        dayOfWeek = ((_days + 3) % 7) + 1;
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

    function addYears(
        uint timestamp,
        uint _years
    ) internal pure returns (uint newTimestamp) {
        (uint year, uint month, uint day) = _daysToDate(
            timestamp / SECONDS_PER_DAY
        );
        year += _years;
        uint daysInMonth = _getDaysInMonth(year, month);
        if (day > daysInMonth) {
            day = daysInMonth;
        }
        newTimestamp =
            _daysFromDate(year, month, day) *
            SECONDS_PER_DAY +
            (timestamp % SECONDS_PER_DAY);
        require(newTimestamp >= timestamp);
    }

    function addMonths(
        uint timestamp,
        uint _months
    ) internal pure returns (uint newTimestamp) {
        (uint year, uint month, uint day) = _daysToDate(
            timestamp / SECONDS_PER_DAY
        );
        month += _months;
        year += (month - 1) / 12;
        month = ((month - 1) % 12) + 1;
        uint daysInMonth = _getDaysInMonth(year, month);
        if (day > daysInMonth) {
            day = daysInMonth;
        }
        newTimestamp =
            _daysFromDate(year, month, day) *
            SECONDS_PER_DAY +
            (timestamp % SECONDS_PER_DAY);
        require(newTimestamp >= timestamp);
    }

    function addDays(
        uint timestamp,
        uint _days
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp + _days * SECONDS_PER_DAY;
        require(newTimestamp >= timestamp);
    }

    function addHours(
        uint timestamp,
        uint _hours
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp + _hours * SECONDS_PER_HOUR;
        require(newTimestamp >= timestamp);
    }

    function addMinutes(
        uint timestamp,
        uint _minutes
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp + _minutes * SECONDS_PER_MINUTE;
        require(newTimestamp >= timestamp);
    }

    function addSeconds(
        uint timestamp,
        uint _seconds
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp + _seconds;
        require(newTimestamp >= timestamp);
    }

    function subYears(
        uint timestamp,
        uint _years
    ) internal pure returns (uint newTimestamp) {
        (uint year, uint month, uint day) = _daysToDate(
            timestamp / SECONDS_PER_DAY
        );
        year -= _years;
        uint daysInMonth = _getDaysInMonth(year, month);
        if (day > daysInMonth) {
            day = daysInMonth;
        }
        newTimestamp =
            _daysFromDate(year, month, day) *
            SECONDS_PER_DAY +
            (timestamp % SECONDS_PER_DAY);
        require(newTimestamp <= timestamp);
    }

    function subMonths(
        uint timestamp,
        uint _months
    ) internal pure returns (uint newTimestamp) {
        (uint year, uint month, uint day) = _daysToDate(
            timestamp / SECONDS_PER_DAY
        );
        uint yearMonth = year * 12 + (month - 1) - _months;
        year = yearMonth / 12;
        month = (yearMonth % 12) + 1;
        uint daysInMonth = _getDaysInMonth(year, month);
        if (day > daysInMonth) {
            day = daysInMonth;
        }
        newTimestamp =
            _daysFromDate(year, month, day) *
            SECONDS_PER_DAY +
            (timestamp % SECONDS_PER_DAY);
        require(newTimestamp <= timestamp);
    }

    function subDays(
        uint timestamp,
        uint _days
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp - _days * SECONDS_PER_DAY;
        require(newTimestamp <= timestamp);
    }

    function subHours(
        uint timestamp,
        uint _hours
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp - _hours * SECONDS_PER_HOUR;
        require(newTimestamp <= timestamp);
    }

    function subMinutes(
        uint timestamp,
        uint _minutes
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp - _minutes * SECONDS_PER_MINUTE;
        require(newTimestamp <= timestamp);
    }

    function subSeconds(
        uint timestamp,
        uint _seconds
    ) internal pure returns (uint newTimestamp) {
        newTimestamp = timestamp - _seconds;
        require(newTimestamp <= timestamp);
    }

    function diffYears(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _years) {
        require(fromTimestamp <= toTimestamp);
        (uint fromYear, , ) = _daysToDate(fromTimestamp / SECONDS_PER_DAY);
        (uint toYear, , ) = _daysToDate(toTimestamp / SECONDS_PER_DAY);
        _years = toYear - fromYear;
    }

    function diffMonths(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _months) {
        require(fromTimestamp <= toTimestamp);
        (uint fromYear, uint fromMonth, ) = _daysToDate(
            fromTimestamp / SECONDS_PER_DAY
        );
        (uint toYear, uint toMonth, ) = _daysToDate(
            toTimestamp / SECONDS_PER_DAY
        );
        _months = toYear * 12 + toMonth - fromYear * 12 - fromMonth;
    }

    function diffDays(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _days) {
        require(fromTimestamp <= toTimestamp);
        _days = (toTimestamp - fromTimestamp) / SECONDS_PER_DAY;
    }

    function diffHours(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _hours) {
        require(fromTimestamp <= toTimestamp);
        _hours = (toTimestamp - fromTimestamp) / SECONDS_PER_HOUR;
    }

    function diffMinutes(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _minutes) {
        require(fromTimestamp <= toTimestamp);
        _minutes = (toTimestamp - fromTimestamp) / SECONDS_PER_MINUTE;
    }

    function diffSeconds(
        uint fromTimestamp,
        uint toTimestamp
    ) internal pure returns (uint _seconds) {
        require(fromTimestamp <= toTimestamp);
        _seconds = toTimestamp - fromTimestamp;
    }
}

interface INFE721 {
    function tokenValue(uint256 tokenId) external view returns (uint256);
}

contract STAKE is
    IERC721Receiver,
    Ownable(msg.sender),
    Pausable,
    ReentrancyGuard,
    ERC165
{
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    Counters.Counter private nextStakingId;

    struct Stake {
        address stakedToken;
        address staker;
        uint256 tokenId;
        uint256 stakedValue;
        uint256 stakedValueUSDT;
        uint256 startedPrice;
        uint256 endedPrice;
        uint256 startedAt;
        uint256 endedAt;
        uint256 forcedUnstakeAt;
        uint8 stakePeriod;
        uint256 aprPercentage;
        uint256 penaltyPercentage;
    }

    struct ERC721Received {
        address operator;
        address from;
        uint256 tokenId;
        bytes data;
    }

    uint256 public MIN_TOKEN_TO_STAKE;
    uint256 private PPM;
    uint256 public FORCED_UNSTAKE_IN_DAYS;
    uint16 public RESTRICTED_RE_STAKING;

    address public SIGNER;
    address public erc721token;
    address public erc20token;
    address public REWARD;
    bool public DEFAULT_PERCENTAGE_USED;
    uint256 public totalStakingPool;
    uint256 public maxStakingPool;

    mapping(uint256 => Stake) public stakes;
    uint256[13] public APR;
    uint256[13] public PENALTY;
    mapping(bytes => bool) public usedSig;
    mapping(uint256 => uint256) public STAKING_REWARD;
    mapping(address => bool) public isAddressBlacklisted;
    mapping(address => bool) public isAdmin;
    mapping(address => mapping(uint256 => bool)) public isTokenIdBlacklisted;
    mapping(address => mapping(uint256 => uint256))
        public restrictedReStakingCounter;
    mapping(uint256 => mapping(uint256 => uint256)) public ESTIMATED_BRV;
    mapping(address => mapping(uint256 => ERC721Received))
        public receivedERC721;

    event MaxStakingPoolUpdated(uint256 previousValue, uint256 newValue);
    event AdminUpdated(address indexed admin, bool isAdmin);
    event BlacklistedAddressUpdated(address indexed user, bool isBlacklisted);
    event BlacklistedTokenIdUpdated(
        address indexed stakedToken,
        uint256 tokenId,
        bool isBlacklisted
    );
    event ForcedUnstakeInDaysUpdated(uint16 unstakeDays);

    event MinNFEUpdated(uint256 minNFE);
    event RestrictedReStakingUpdated(uint16 restrictN);
    event SignerAddressUpdated(address signerAddress);
    event NFEAddressUpdated(address nfeAddress);
    event DPMCAddressUpdated(address dpmcAddress);
    event RewardAddressUpdated(address rewardAddress);
    event PercentageUsedUpdated(bool isPercentageUsed);
    event AprPercentageUpdated(
        uint8 stakePeriod,
        uint256 previousValue,
        uint256 newValue
    );
    event PenaltyPercentageUpdated(
        uint8 indexed stakePeriod,
        uint256 penaltyValue
    );

    event Staking(
        uint256 stakeId,
        uint256 tokenId,
        uint256 tokenValue,
        uint256 period,
        uint256 apr,
        uint256 penalty,
        uint256 startedPrice,
        uint256 startedAt,
        uint256 endedAt,
        uint256 forcedUnstakeAt,
        uint256 brvLow,
        uint256 brvHigh
    );
    event UnStaking(
        uint256 stakeId,
        uint256 tokenId,
        uint256 endedPrice,
        uint256 reward,
        uint256 finalApr,
        uint256 finalPenalty,
        uint256 timeStamp
    );

    event ForceStop(
        uint256 stakeId,
        uint256 tokenId,
        address staker,
        address admin,
        uint256 timeStamp
    );

    constructor() {
        nextStakingId.increment();
        MIN_TOKEN_TO_STAKE = 100000000000000000000; // 100 erc20token
        PPM = 1000000; // ppm (parts per million)
        RESTRICTED_RE_STAKING = 0; // if 0 is unlimited
        erc721token = 0x4515b54Ca126C52A5C25d98c2e5B94EDd59971Cc;
        erc20token = 0xb63683C2d9563C25F65793164a282eF82C0A03F6;
        REWARD = 0x900c6f8AAcd4AA70F1477Be27CcbbD4bf9CC011E;
        SIGNER = 0x143e5C4160Eaef1c01251D23F2A04F0b3e9d6c10;
        DEFAULT_PERCENTAGE_USED = true;
        FORCED_UNSTAKE_IN_DAYS = 30; // >= 30 days left
        APR[3] = 150000;
        APR[6] = 150000;
        APR[9] = 150000;
        APR[12] = 150000;
        PENALTY[3] = 100000;
        PENALTY[6] = 100000;
        PENALTY[9] = 100000;
        PENALTY[12] = 100000;
        maxStakingPool = 0;
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        // Add custom logic for handling received tokens here
        ERC721Received storage erc721 = receivedERC721[from][tokenId];
        erc721.operator = operator;
        erc721.from = from;
        erc721.tokenId = tokenId;
        erc721.data = data;
        return this.onERC721Received.selector;
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
        return ECDSA.recover(_hashedMessage, sig);
    }

    modifier onlyAdmin() {
        require(
            isAdmin[msg.sender] || msg.sender == owner(),
            "Only the admin can perform this action."
        );
        _;
    }

    function addOrRemoveAdmin(address _admin, bool _true) public onlyOwner {
        isAdmin[_admin] = _true;
        emit AdminUpdated(_admin, _true);
    }

    function updateMaxStakingPool(
        uint256 newMaxStakingPool
    ) external onlyAdmin {
        uint256 previousMaxStakingPool = maxStakingPool;
        maxStakingPool = newMaxStakingPool;
        emit MaxStakingPoolUpdated(previousMaxStakingPool, newMaxStakingPool);
    }

    function updateBlacklistedAddress(
        address _user,
        bool _isBlacklisted
    ) public onlyAdmin {
        isAddressBlacklisted[_user] = _isBlacklisted;
        emit BlacklistedAddressUpdated(_user, _isBlacklisted);
    }

    function updateBlacklistedTokenId(
        uint256 tokenId,
        bool _isBlacklisted
    ) public onlyAdmin {
        isTokenIdBlacklisted[erc721token][tokenId] = _isBlacklisted;
        emit BlacklistedTokenIdUpdated(erc721token, tokenId, _isBlacklisted);
    }

    function updateForceUnstakeInDays(uint16 _days) public onlyAdmin {
        FORCED_UNSTAKE_IN_DAYS = _days;
        emit ForcedUnstakeInDaysUpdated(_days);
    }

    function updateMinStake(uint256 _mintStake) public onlyAdmin {
        MIN_TOKEN_TO_STAKE = _mintStake;
        emit MinNFEUpdated(_mintStake);
    }

    function updateRestrictedReStaking(uint16 _restrictN) public onlyAdmin {
        RESTRICTED_RE_STAKING = _restrictN;
        emit RestrictedReStakingUpdated(_restrictN);
    }

    function updateSignerAddress(address _signerAddress) public onlyAdmin {
        SIGNER = _signerAddress;
        emit SignerAddressUpdated(_signerAddress);
    }

    function updateNFEaddress(address _nfeAddress) public onlyAdmin {
        erc721token = _nfeAddress;
        emit NFEAddressUpdated(_nfeAddress);
    }

    function updateDPMCaddress(address _dpmcAddress) public onlyAdmin {
        erc20token = _dpmcAddress;
        emit DPMCAddressUpdated(_dpmcAddress);
    }

    function updateRewardAddress(address _rewardAddress) public onlyAdmin {
        REWARD = _rewardAddress;
        emit RewardAddressUpdated(_rewardAddress);
    }

    function updatePercentageUsed(bool _true) public onlyAdmin {
        DEFAULT_PERCENTAGE_USED = _true;
        emit PercentageUsedUpdated(_true);
    }

    function updateAprPercentage(
        uint8 _stakePeriod,
        uint256 _aprValue
    ) public onlyAdmin {
        require(
            _aprValue >= 10000,
            "AV2: APR percentage should be greater than or equal to 1%"
        );
        uint256 previousAprValue = APR[_stakePeriod];

        APR[_stakePeriod] = _aprValue;
        emit AprPercentageUpdated(_stakePeriod, previousAprValue, _aprValue);
    }

    function updatePenaltyPercentage(
        uint8 _stakePeriod,
        uint256 _penaltyValue
    ) public onlyAdmin {
        require(
            _penaltyValue < PPM,
            "PV1: penaltyPercentage should be less than PPM"
        );
        require(
            _penaltyValue >= 10000 && _penaltyValue <= PPM,
            "PV2: penaltyPercentage should be between 10 - 20 %"
        );
        PENALTY[_stakePeriod] = _penaltyValue;
        emit PenaltyPercentageUpdated(_stakePeriod, _penaltyValue);
    }

    function isRestricted(uint counter) public view returns (bool) {
        return RESTRICTED_RE_STAKING > 0 && counter >= RESTRICTED_RE_STAKING;
    }

    function calculatePenaltyValue(
        uint256 _aprValue,
        uint8 _stakePeriod,
        uint256 _penaltyPercentage
    ) public view returns (uint256) {
        uint256 res = (_aprValue / 12) * (_stakePeriod - 1);
        uint256 _penalty = res - ((res * _penaltyPercentage) / PPM);
        return _penalty;
    }

    function calculatePenaltyBRV(
        uint256 _usdtValue,
        uint256 _penaltyPercentage
    ) public view returns (uint256) {
        uint256 _penalty = (_usdtValue * _penaltyPercentage) / PPM;
        return _penalty;
    }

    function GPV(
        uint256 _tokenRateUSDT,
        uint256 _tokenValue
    ) public pure returns (uint256) {
        return (_tokenRateUSDT * _tokenValue) / 10 ** 18; // divide by 10^18 to get the value in USDT
    }

    function AMP(uint256 _aprPercentage) public pure returns (uint256) {
        uint256 aprMonthlyPercentage = _aprPercentage.mul(10) / 12;
        return aprMonthlyPercentage;
    }

    function SPP(
        uint256 _amp,
        uint256 _stakePeriod
    ) public pure returns (uint256) {
        uint256 stakePeriodPercentage = _amp.mul(_stakePeriod);
        return stakePeriodPercentage;
    }

    function BRV(uint256 _gpv, uint256 _spp) public pure returns (uint256) {
        // BRV = GPV * SPP
        uint256 basedRewardValue = _gpv.mul(_spp).div(10000000);
        return basedRewardValue;
    }

    function calculateBasedRewardValue(
        uint256 _apr,
        uint256 _tokenRateUSDT,
        uint256 _tokenValue,
        uint256 _stakePeriod
    ) public pure returns (uint256) {
        uint256 aprMonthlyPercentage = AMP(_apr);
        uint256 stakePeriodPercentage = SPP(aprMonthlyPercentage, _stakePeriod);
        uint256 globalParameterValue = GPV(_tokenRateUSDT, _tokenValue);
        uint256 basedRewardValue = BRV(
            globalParameterValue,
            stakePeriodPercentage
        );
        return basedRewardValue;
    }

    function convertUsdtToToken(
        uint256 usdtAmount,
        uint256 tokenRateUSDT
    ) public pure returns (uint256) {
        uint256 tokenAmount = (usdtAmount * (10 ** 18)) / tokenRateUSDT; // convert USDT to erc20token with 18 decimal places
        return tokenAmount;
    }

    function getCertPriceInUsdt(
        uint256 tokenPrice,
        uint256 tokenAmount
    ) public pure returns (uint256) {
        return (tokenAmount * tokenPrice) / 10 ** 18; // divide by 10^18 to get the value in USDT
    }

    function periodList() public view returns (uint256[] memory) {
        uint256[] memory output = new uint256[](37);
        uint256 count = 0;

        for (uint256 i = 0; i < APR.length; i++) {
            if (APR[i] > 0) {
                output[count] = i;
                count++;
            }
        }

        // Resize the output array to the actual number of values found
        assembly {
            mstore(output, count)
        }

        return output;
    }

    function periodInUnixTimestamp(
        uint256 _stakePeriod
    ) public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        // uint256 timestamp = BokkyPooBahsDateTimeLibrary.addMonths(currentTime, _stakePeriod);
        uint256 timestamp = BokkyPooBahsDateTimeLibrary.addMinutes(
            currentTime,
            _stakePeriod
        );
        return timestamp;
    }

    function forcedUnstakePeriodInUnixTimestamp(
        uint256 _stakeEndedAt
    ) public pure returns (uint256) {
        // uint256 timestamp = BokkyPooBahsDateTimeLibrary.subDays(_stakeEndedAt, FORCED_UNSTAKE_IN_DAYS);
        uint256 timestamp = BokkyPooBahsDateTimeLibrary.subMinutes(
            _stakeEndedAt,
            1
        );
        return timestamp;
    }

    function calculatePercentage(
        uint256 value,
        uint256 basisPoints
    ) public view returns (uint256) {
        uint256 percentage = (value * basisPoints) / PPM;
        return percentage;
    }

    function _calculateRewards(
        uint256 certUsdtValue,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 tokenValue
    )
        internal
        view
        returns (uint256 stakingRewardLow, uint256 stakingRewardHigh)
    {
        uint256 brvLow = calculatePenaltyBRV(
            certUsdtValue,
            PENALTY[stakePeriod]
        );
        uint256 brvHigh = calculateBasedRewardValue(
            APR[stakePeriod],
            tokenRateUSDT,
            tokenValue,
            stakePeriod
        );
        stakingRewardLow = convertUsdtToToken(brvLow, tokenRateUSDT);
        stakingRewardHigh = convertUsdtToToken(brvHigh, tokenRateUSDT);
    }

    function staking(
        uint256 tokenId,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes memory sig
    ) public whenNotPaused nonReentrant returns (uint256 tokenValue) {
        tokenValue = getTokenValue(tokenId);
        uint256 stakingPoolValue = totalStakingPool + tokenValue;
        require(
            maxStakingPool == 0 || stakingPoolValue <= maxStakingPool,
            "Staking pool limit exceeded."
        );
        require(exp > block.timestamp, "Signature is expired.");
        require(!usedSig[sig], "Signature already used");
        require(APR[stakePeriod] > 0, "ST0: Invalid staking period");
        require(
            !isAddressBlacklisted[msg.sender],
            "ST1: User address is blacklisted"
        );
        require(
            !isTokenIdBlacklisted[erc721token][tokenId],
            "ST2: This tokenID is blacklisted"
        );
        require(
            !isRestricted(restrictedReStakingCounter[erc721token][tokenId]),
            "ST3: Restricted re-staking has exceeded the maximum limit"
        );

        // Verify the signature
        bytes32 _hashedMessage = keccak256(
            abi.encodePacked(
                msg.sender,
                tokenId,
                stakePeriod,
                tokenRateUSDT,
                exp
            )
        );
        require(
            recoverSigner(_hashedMessage, sig) == SIGNER,
            "US1: Invalid signer"
        );
        require(
            IERC721(erc721token).ownerOf(tokenId) == msg.sender,
            "ST4: You do not own this token"
        );
        require(
            IERC721(erc721token).isApprovedForAll(msg.sender, address(this)),
            "ST5: Contract must be approved"
        );

        require(
            tokenValue >= MIN_TOKEN_TO_STAKE,
            "ST6: erc721token value is lower than MIN_TOKEN_TO_STAKE"
        );

        uint256 certUsdtValue = getCertPriceInUsdt(tokenRateUSDT, tokenValue);

        IERC721(erc721token).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        (
            uint256 stakingRewardLow,
            uint256 stakingRewardHigh
        ) = _calculateRewards(
                certUsdtValue,
                stakePeriod,
                tokenRateUSDT,
                tokenValue
            );

        uint256 stakeId = nextStakingId.current();
        createStake(
            stakeId,
            tokenId,
            stakePeriod,
            tokenRateUSDT,
            certUsdtValue,
            tokenValue
        );

        restrictedReStakingCounter[erc721token][tokenId] += 1;

        totalStakingPool += tokenValue;

        nextStakingId.increment();

        emitStakingEvent(
            stakeId,
            tokenId,
            tokenValue,
            stakePeriod,
            tokenRateUSDT,
            stakingRewardLow,
            stakingRewardHigh
        );
    }

    function forceStop(uint256 stakeId) external onlyAdmin nonReentrant {
        Stake storage stake = stakes[stakeId];
        require(stake.endedPrice == 0, "US2: this stakeId has been unstaked.");

        INFE721 NFECERT = INFE721(erc721token);
        uint256 tokenValue = NFECERT.tokenValue(stake.tokenId);

        stake.endedPrice = 1;
        totalStakingPool -= tokenValue;

        IERC721(erc721token).safeTransferFrom(
            address(this),
            stake.staker,
            stake.tokenId
        );

        emit ForceStop(
            stakeId,
            stake.tokenId,
            stake.staker,
            msg.sender,
            block.timestamp
        );
    }

    function getTokenValue(uint256 tokenId) internal view returns (uint256) {
        INFE721 NFECERT = INFE721(erc721token);
        return NFECERT.tokenValue(tokenId);
    }

    function createStake(
        uint256 stakeId,
        uint256 tokenId,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 certUsdtValue,
        uint256 tokenValue
    ) internal {
        Stake storage stake = stakes[stakeId];
        stake.stakedToken = erc721token;
        stake.staker = msg.sender;
        stake.tokenId = tokenId;
        stake.stakedValue = tokenValue;
        stake.stakedValueUSDT = certUsdtValue;
        stake.startedPrice = tokenRateUSDT;
        stake.startedAt = block.timestamp;
        stake.endedAt = periodInUnixTimestamp(stakePeriod);
        stake.forcedUnstakeAt = forcedUnstakePeriodInUnixTimestamp(
            periodInUnixTimestamp(stakePeriod)
        );
        stake.stakePeriod = stakePeriod;
        stake.aprPercentage = APR[stakePeriod];
        stake.penaltyPercentage = PENALTY[stakePeriod];
    }

    function calculateEstimatedBRV(
        uint256 stakeId,
        uint256 tokenRateUSDT,
        uint256 tokenValue,
        uint8 stakePeriod
    ) internal {
        // Removed MIN_APR and MAX_APR loop. Please refactor this logic as needed.
    }

    function emitStakingEvent(
        uint256 stakeId,
        uint256 tokenId,
        uint256 tokenValue,
        uint8 stakePeriod,
        uint256 tokenRateUSDT,
        uint256 brvLow,
        uint256 brvHigh
    ) internal {
        uint256 periodEnd = periodInUnixTimestamp(stakePeriod);
        uint256 forcedUnstakeAt = forcedUnstakePeriodInUnixTimestamp(periodEnd);

        emit Staking(
            stakeId,
            tokenId,
            tokenValue,
            stakePeriod,
            APR[stakePeriod],
            PENALTY[stakePeriod],
            tokenRateUSDT,
            block.timestamp,
            periodEnd,
            forcedUnstakeAt,
            brvLow,
            brvHigh
        );
    }

    function unStaking(
        uint256 stakeId,
        uint256 tokenRateUSDT,
        uint256 exp,
        bytes memory sig
    ) public nonReentrant {
        require(exp > block.timestamp, "Signature is expired.");
        require(!usedSig[sig], "Signature already used.");
        Stake storage stake = stakes[stakeId];

        bytes32 _hashedMessage = keccak256(
            abi.encodePacked(msg.sender, stakeId, tokenRateUSDT, exp)
        );
        require(
            recoverSigner(_hashedMessage, sig) == SIGNER,
            "US1: Invalid signer."
        );

        require(stake.endedPrice == 0, "US2: this stakeId has been unstaked.");
        require(
            stake.staker == msg.sender,
            "US3: msg sender should be the staker address."
        );
        require(
            block.timestamp >= stake.forcedUnstakeAt,
            "US4: unable to unstake."
        );

        bool isForcedUnstaked = block.timestamp < stake.endedAt;
        uint256 _finalAPR = DEFAULT_PERCENTAGE_USED
            ? stake.aprPercentage
            : APR[stake.stakePeriod];
        uint256 _finalPenalty = DEFAULT_PERCENTAGE_USED
            ? stake.penaltyPercentage
            : PENALTY[stake.stakePeriod];

        uint256 stakingReward;

        if (isForcedUnstaked) {
            uint256 _penaltyPercentage = calculatePenaltyValue(
                _finalAPR,
                stake.stakePeriod,
                _finalPenalty
            );
            uint256 _penaltyBRV = calculatePenaltyBRV(
                stake.stakedValueUSDT,
                _penaltyPercentage
            );
            stakingReward = convertUsdtToToken(_penaltyBRV, tokenRateUSDT);
        } else {
            uint256 brv = calculateBasedRewardValue(
                _finalAPR,
                tokenRateUSDT,
                stake.stakedValue,
                stake.stakePeriod
            );
            stakingReward = convertUsdtToToken(brv, tokenRateUSDT);
        }

        require(IERC20(erc20token).balanceOf(REWARD) >= stakingReward, "Insufficient reward balance");
        require(IERC20(erc20token).allowance(REWARD, address(this)) >= stakingReward, "Insufficient reward allowance");

        // Transfer the NFT back to the staker
        IERC721(erc721token).safeTransferFrom(
            address(this),
            msg.sender,
            stake.tokenId
        );
        IERC20(erc20token).safeTransferFrom(REWARD, msg.sender, stakingReward);

        INFE721 NFECERT = INFE721(erc721token);
        uint256 tokenValue = NFECERT.tokenValue(stake.tokenId);

        // Update the stake with the end price
        stake.endedPrice = tokenRateUSDT;
        totalStakingPool -= tokenValue;

        // Emit the event
        emit UnStaking(
            stakeId,
            stake.tokenId,
            tokenRateUSDT,
            stakingReward,
            _finalAPR,
            _finalPenalty,
            block.timestamp
        );
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}

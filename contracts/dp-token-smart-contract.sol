// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(
        address sender,
        uint256 balance,
        uint256 needed
    );

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(
        address spender,
        uint256 allowance,
        uint256 needed
    );

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(
        address sender,
        uint256 balance,
        uint256 needed,
        uint256 tokenId
    );

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256))
        private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(
        address owner,
        address spender
    ) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(
        address spender,
        uint256 value
    ) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the ERC. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     * ```
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(
        address owner,
        address spender,
        uint256 value,
        bool emitEvent
    ) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(
        address owner,
        address spender,
        uint256 value
    ) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(
                    spender,
                    currentAllowance,
                    value
                );
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a - b;
        assert(b <= a && c <= a);
        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a + b;
        assert(c >= a && c >= b);
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }
}

library SafeERC20 {
    function safeTransfer(IERC20 _token, address _to, uint256 _value) internal {
        require(_token.transfer(_to, _value));
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        _transferOwnership(_msgSender());
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract Pausable is Context, Ownable {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Called by the owner to pause the contract.
     */
    function pause() public onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Called by the owner to unpause the contract.
     */
    function unpause() public onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

contract DPToken is ERC20, Ownable, Pausable, ReentrancyGuard {

    address internal receiver;
    address public taxAddress;
    
    // Uniswap V4 additive support
    address public V4PoolManager;
    address public V4Router;
    address public Permit2; // optional Permit2 wiring

    uint24 public BUY_TAX;
    bool public DEBUG;

    mapping(address => uint256) public tokenLocked;
    mapping(address => bool) public stakingContract;
    mapping(address => bool) public blacklist;
    mapping(address => bool) public whitelist;

    event BuyTaxPercentageUpdated(uint24 newBuyTaxPercentage);
    event TaxAddressUpdated(address newTaxAddress);
    // Uniswap V4 events (additive)
    event V4PoolManagerUpdated(address newV4PoolManager);
    event V4RouterUpdated(address newV4Router);
    event Permit2Updated(address newPermit2);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event DebugUpdated(bool newDebug);
    event TokenLockedUpdated(address indexed account, uint256 lockedAmount);
    event StakingContractUpdated(address indexed account, bool status);
    event UniswapDebug(
        address indexed sender,
        address indexed from,
        address indexed to,
        uint256 value
    );

    modifier onlyStakingContract() {
        require(stakingContract[msg.sender], "Not staking contract");
        _;
    }

    constructor(address _receiver, address _taxAddress, uint24 _buyTax) ERC20("DPToken", "DPT") {
        require(_receiver != address(0), "Invalid receiver");
        require(_taxAddress != address(0), "Tax address cannot be zero");
        require(_buyTax <= 1000000, "Tax percentage must be 1000000 (100%) or less");
        BUY_TAX = _buyTax;
        receiver = _receiver;
        taxAddress = _taxAddress;
        V4PoolManager = address(0);
        V4Router = address(0);
        Permit2 = address(0);
        whitelist[receiver] = true;
        whitelist[taxAddress] = true;
        _mint(receiver, 100000000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public returns (bool) {
        _approve(
            _msgSender(),
            spender,
            allowance(_msgSender(), spender) + addedValue
        );
        return true;
    }

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public returns (bool) {
        uint256 currentAllowance = allowance(_msgSender(), spender);
        require(
            subtractedValue <= currentAllowance,
            "ERC20: decreased allowance below zero"
        );
        _approve(_msgSender(), spender, currentAllowance - subtractedValue);
        return true;
    }

    function updateLockedAmount(
        address account,
        uint256 amount,
        bool increase
    ) external onlyStakingContract {
        require(account != address(0), "Invalid account");

        if (increase) {
            // Increase the locked amount
            tokenLocked[account] += amount;
        } else {
            // Ensure we don’t underflow
            require(
                tokenLocked[account] >= amount,
                "Insufficient locked tokens"
            );
            tokenLocked[account] -= amount;
        }

        emit TokenLockedUpdated(account, tokenLocked[account]);
    }

    function setStakingContract(
        address account,
        bool status
    ) external onlyOwner {
        require(account != address(0), "Invalid staking contract");
        stakingContract[account] = status;
        emit StakingContractUpdated(account, status);
    }

    // Buy Tax Percentage
    function updateBuyTaxPercentage(
        uint24 newBuyTaxPercentage
    ) public onlyOwner {
        require(
            newBuyTaxPercentage <= 1000000,
            "Tax percentage must be 1000000 (100%) or less"
        );
        BUY_TAX = newBuyTaxPercentage;
        emit BuyTaxPercentageUpdated(newBuyTaxPercentage);
    }

    // Tax Address
    function updateTaxAddress(address newTaxAddress) public onlyOwner {
        require(newTaxAddress != address(0), "Tax address cannot be zero");
        taxAddress = newTaxAddress;
        emit TaxAddressUpdated(newTaxAddress);
    }

    

    // ===== Uniswap V4 additive setters =====
    function updateV4PoolManager(address newV4PoolManager) public onlyOwner {
        require(
            newV4PoolManager != address(0),
            "V4PoolManager address cannot be zero"
        );
        V4PoolManager = newV4PoolManager;
        emit V4PoolManagerUpdated(newV4PoolManager);
    }

    function updateV4Router(address newV4Router) public onlyOwner {
        require(newV4Router != address(0), "V4Router address cannot be zero");
        V4Router = newV4Router;
        emit V4RouterUpdated(newV4Router);
    }

    function updatePermit2(address newPermit2) public onlyOwner {
        require(newPermit2 != address(0), "Permit2 address cannot be zero");
        Permit2 = newPermit2;
        emit Permit2Updated(newPermit2);
    }

    

    function addBlacklist(address account) public onlyOwner {
        require(account != address(0), "Account address cannot be zero");
        require(!whitelist[account], "Account address is whitelisted");
        require(!blacklist[account], "Account address is already blacklisted");
        blacklist[account] = true;
        emit BlacklistUpdated(account, true);
    }

    function removeFromBlacklist(address account) public onlyOwner {
        require(account != address(0), "Account address cannot be zero");
        require(blacklist[account], "Account address is not blacklisted");
        blacklist[account] = false;
        emit BlacklistUpdated(account, false);
    }

    function addWhitelist(address account) public onlyOwner {
        require(account != address(0), "Account address cannot be zero");
        require(!blacklist[account], "Account address is blacklisted");
        require(!whitelist[account], "Account address is already whitelisted");
        whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }

    function removeFromWhitelist(address account) public onlyOwner {
        require(account != address(0), "Account address cannot be zero");
        require(whitelist[account], "Account address is not whitelisted");
        whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }

    function setDebug(bool newDebug) external onlyOwner {
        DEBUG = newDebug;
        emit DebugUpdated(newDebug);
    }

    function isWhitelisted(address account) internal view returns (bool) {
        return whitelist[account];
    }

    function isBlacklisted(address account) internal view returns (bool) {
        return blacklist[account];
    }

    function isContract(address account) internal view returns (bool) {
        /**
         * This method is a simplistic check for a contract address
         * It may produce false positives or false negatives, but it is often sufficient
         */
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function isWhitelistedOrUniswapAdress(
        address _address
    ) public view returns (bool) {
        if (isContract(_address)) {
            return (isWhitelisted(_address) ||
                isUniswapRouter(_address) ||
                isUniswapV4(_address));
        } else {
            return isWhitelisted(_address);
        }
    }

    function isUniswapRouter(address _to) internal view returns (bool) {
        return _to == V4Router;
    }

    // Uniswap V4 helpers
    function isUniswapV4Manager(address _address) internal view returns (bool) {
        return _address == V4PoolManager;
    }

    function isUniswapV4Router(address _address) internal view returns (bool) {
        return _address == V4Router;
    }

    function isUniswapV4(address _address) internal view returns (bool) {
        return (
            _address == V4PoolManager ||
            _address == V4Router ||
            _address == Permit2
        );
    }

    

    function calculateFee(
        uint256 _amount,
        uint24 percentage
    ) public pure returns (uint256 fee) {
        uint256 _fee = (_amount * percentage) / (10 ** 6);
        require(percentage <= 10 ** 6, "CT1: Percentage too large");
        return _fee;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public override returns (bool) {
        // Check for blacklisted addresses
        require(
            !isBlacklisted(msg.sender),
            "T1 - Error: Sender's address is blacklisted and cannot initiate transactions."
        );
        require(
            !isBlacklisted(_to),
            "T2 - Error: Recipient's address is blacklisted, and the transaction cannot be completed."
        );

        // Check if the contract is paused for non-whitelisted and non-Uniswap V4 addresses
        if (!isWhitelistedOrUniswapAdress(msg.sender)) {
            require(
                !paused(),
                "T3 - Transaction failed: The sender's address is not whitelisted, and the contract is currently paused."
            );
        }

        // Check if the recipient is whitelisted or a Uniswap V4 address
        if (!isWhitelistedOrUniswapAdress(_to)) {
            require(
                !paused(),
                "T4 - Transaction failed: The recipient's address is not whitelisted, and the contract is currently paused."
            );
        }

        // Determine if it's a buy transaction (V4 manager sending tokens to EOA)
        bool isBuyV4 = isUniswapV4Manager(msg.sender) && !isContract(_to);

        // Apply tax fee for buy transactions (use BUY_TAX for V4)
        uint24 taxFee = isBuyV4 ? BUY_TAX : 0;

        // Calculate the total fee and the value after tax
        uint256 totalFee = calculateFee(_value, taxFee);
        uint256 valueAfterTax = _value - totalFee;

        // Transfer the tax fee if applicable
        if (totalFee > 0) {
            _tokenTransfer(msg.sender, taxAddress, totalFee);
        }

        // To add debug log on transaction
        if (DEBUG) {
            emit UniswapDebug(msg.sender, msg.sender, _to, valueAfterTax);
        }

        // Transfer the remaining amount to the recipient
        return _tokenTransfer(msg.sender, _to, valueAfterTax);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public override returns (bool success) {
        // Check for blacklisted addresses
        require(
            !isBlacklisted(_from),
            "TF1 - Error: Sender's address is blacklisted and cannot initiate transactions."
        );
        require(
            !isBlacklisted(_to),
            "TF2 - Error: Recipient's address is blacklisted, and the transaction cannot be completed."
        );

        if (!isWhitelistedOrUniswapAdress(_from)) {
            require(
                !paused(),
                "TF3 - Transaction failed: The sender's address is not whitelisted, and the contract is currently paused."
            );
        }
        if (!isWhitelistedOrUniswapAdress(_to)) {
            require(
                !paused(),
                "TF4 - Transaction failed: The recipient's address is not whitelisted, and the contract is currently paused."
            );
        }

        uint256 currentAllowance = allowance(_from, msg.sender);
        require(
            currentAllowance >= _value,
            "ERC20: transfer amount exceeds allowance"
        );

        _approve(_from, msg.sender, currentAllowance - _value);

        // Enforce unlocked balance
        require(
            balanceOf(_from) - tokenLocked[_from] >= _value,
            "Insufficient locked tokens"
        );

        // To add debug log on transaction
        if (DEBUG) {
            emit UniswapDebug(msg.sender, _from, _to, _value);
        }

        // Apply tax on buy from V4 manager to EOA
        bool isBuyV4 = isUniswapV4Manager(_from) && !isContract(_to);
        uint24 taxFee = isBuyV4 ? BUY_TAX : 0;
        uint256 totalFee = calculateFee(_value, taxFee);
        uint256 valueAfterTax = _value - totalFee;

        if (totalFee > 0) {
            _tokenTransfer(_from, taxAddress, totalFee);
        }

        return _tokenTransfer(_from, _to, valueAfterTax);
    }

    function _tokenTransfer(
        address _from,
        address _to,
        uint256 _value
    ) private returns (bool success) {
        require(
            balanceOf(_from) >= _value,
            "ERC20: transfer amount exceeds balance"
        );
        require(
            balanceOf(_from) - tokenLocked[_from] >= _value,
            "Insufficient unlocked balance"
        );
        super._transfer(_from, _to, _value);

        return true;
    }
}
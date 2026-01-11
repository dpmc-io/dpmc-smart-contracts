# Testing Suite

This document summarizes unit, integration, and adversarial tests, test vectors, and build hygiene with direct links to source.

## Unit Tests
- Access control and pause behavior
  - STAKE pause/unpause events: [stake.spec.js:L39-L42](test/stake.spec.js#L39-L42)
  - StableStaking admin gating and pause/unpause: [stable-staking.spec.js:L41-L47](test/stable-staking.spec.js#L41-L47)
- Signature expiry and signer validation
  - StableStaking invalid period, expired signature, invalid signer: [stable-staking.spec.js:L59-L97](test/stable-staking.spec.js#L59-L97)
- Parameter bounds and inputs
  - StableStaking withdrawInterest array length checks: [stable-staking.spec.js:L99-L112](test/stable-staking.spec.js#L99-L112)
  - Certificate transfer restrictions and tokenURI checks: [certificate.spec.js:L24-L33](test/certificate.spec.js#L24-L33)
  - DPToken authorization and paused behavior (examples across dp-token.spec.js)

## Integration Tests
- Staking flows and reward calculations
  - STAKE flow: stake, then forced stop and unStaking checks in adversarial setup: [stake.spec.js:L44-L69](test/stake.spec.js#L44-L69)
- Lock modes and pool accounting updates
  - StableStaking lifecycle updates (pool and user metrics referenced within tests): [stable-staking.spec.js:L25-L38](test/stable-staking.spec.js#L25-L38)

## Adversarial Tests
- Reentrancy attempt during ERC721 receipt that triggers unStaking
  - Attacker harness calls unStaking inside onERC721Received: [ReentrancyAttacker.sol:L73-L81](contracts/mocks/ReentrancyAttacker.sol#L73-L81)
  - Test wiring and expectation: [stake.spec.js:L44-L69](test/stake.spec.js#L44-L69)

## Test Vectors
- Stake signature payload
  - Fields: [address staker, uint tokenId, uint8 stakePeriod, uint tokenRateUSDT, uint exp]
  - Digest and signing: [stake.spec.js:L53-L59](test/stake.spec.js#L53-L59)
- Unstake signature payload
  - Fields: [address staker, uint stakeId, uint tokenRateUSDT, uint exp]
  - Digest and signing: [stake.spec.js:L61-L67](test/stake.spec.js#L61-L67)
- StableStaking signature payloads (stake/withdraw/interest)
  - Digest formation examples: [stable-staking.spec.js:L61-L67](test/stable-staking.spec.js#L61-L67), [stable-staking.spec.js:L74-L80](test/stable-staking.spec.js#L74-L80), [stable-staking.spec.js:L103-L109](test/stable-staking.spec.js#L103-L109)
- Replay protection
  - Enforced via usedSig in StableStaking; expiry checks verified in tests (see above)

## Build Hygiene
- Commands
  - Typecheck: `npm run typecheck`
  - Tests: `npm run test`
  - Lint Solidity: `npm run lint:sol`
  - Lint JS: `npm run lint:js`
- Current status
  - Typecheck/compile: success (EVM target: Paris)
  - Tests: all passing across contract suites
  - Lint: warnings only (line-length), no errors

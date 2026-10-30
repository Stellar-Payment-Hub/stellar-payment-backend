# Frequently Asked Questions (FAQ)

### Q: How does Stellar Payment Hub eliminate rounding loss in split bills?
**A**: We use Euclidean division on integer **Stroops** ((1 \text{ XLM} = 10^7 \text{ Stroops})). The integer remainder (`total % N`) is assigned to the primary recipient, mathematically guaranteeing that the sum of all allocations strictly equals the input amount.

### Q: What tokens are supported?
**A**: Native XLM and any Stellar Asset Contract (SAC) token, including USDC, EURC, and custom anchor stablecoins.

### Q: Can non-admins pause the smart contracts?
**A**: No. The emergency pause method requires valid cryptographic authorization matching the contract Admin address.

# Remainder-Safe Integer Mathematics Proof

## The Problem: Financial Truncation Loss

When splitting a monetary quantity ( A ) across ( N ) recipients, floating-point divisions typically introduce fractional truncation:

$$\frac{A}{N} \notin \mathbb{Z}$$

In conventional systems, summing the truncated parts yields:

$$\sum_{i=1}^{N} \lfloor \frac{A}{N} \rfloor < A$$

The difference ( R = A - N \times \lfloor \frac{A}{N} \rfloor ) represents trapped or leaked currency.

## The Solution: Zero-Loss Stroop Allocation

In the Stellar Payment Hub:
1. All amounts are converted to integer **Stroops** (( 1 \text{ XLM} = 10^7 \text{ Stroops} )).
2. Base allocation per recipient: ( b = \lfloor \frac{S_{total}}{N} \rfloor ).
3. Exact remainder Stroops: ( r = S_{total} \pmod{N} ), where ( 0 \le r < N ).
4. Allocation rule:
   - Primary recipient (( i = 1 )): receives ( b + r ) Stroops.
   - Remaining recipients (( i > 1 )): receive ( b ) Stroops.

## Mathematical Invariance Proof

$$\sum_{i=1}^{N} S_i = (b + r) + \sum_{i=2}^{N} b = b + r + (N - 1)b = N \times b + r$$

Since ( S_{total} = N \times b + r ) by Euclidean division:

$$\sum_{i=1}^{N} S_i \equiv S_{total} \quad (\text{Strict Invariance})$$

**Zero Stroops are ever lost or created.**

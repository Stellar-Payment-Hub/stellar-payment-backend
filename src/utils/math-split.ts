export interface DeterministicSplitResult {
  totalStroops: bigint;
  baseStroopsPerRecipient: bigint;
  remainderStroops: bigint;
  recipients: Array<{
    index: number;
    stroops: bigint;
    amountDecimal: string;
    isRemainderRecipient: boolean;
  }>;
  proofValid: boolean;
}

const STROOPS_FACTOR = 10_000_000n;

export function calculateDeterministicSplit(
  totalAmount: number | string,
  recipientCount: number,
  asset = 'XLM'
): DeterministicSplitResult {
  const count = BigInt(Math.max(1, recipientCount));
  const numAmt = parseFloat(String(totalAmount)) || 0;
  const totalStroops = BigInt(Math.round(numAmt * 10_000_000));

  const baseStroopsPerRecipient = totalStroops / count;
  const remainderStroops = totalStroops % count;

  const recipients: DeterministicSplitResult['recipients'] = [];
  let accountedStroops = 0n;

  for (let i = 0; i < Number(count); i++) {
    const isFirst = i === 0;
    const recipientStroops = isFirst ? baseStroopsPerRecipient + remainderStroops : baseStroopsPerRecipient;
    accountedStroops += recipientStroops;

    const decimalVal = (Number(recipientStroops) / 10_000_000).toFixed(7);
    recipients.push({
      index: i + 1,
      stroops: recipientStroops,
      amountDecimal: decimalVal,
      isRemainderRecipient: isFirst && remainderStroops > 0n,
    });
  }

  const proofValid = accountedStroops === totalStroops;

  return {
    totalStroops,
    baseStroopsPerRecipient,
    remainderStroops,
    recipients,
    proofValid,
  };
}

export interface SplitRecipientAllocation {
  recipient: string;
  stroops: number;
  amountXlm: string;
  isRemainderReceiver: boolean;
}

export interface SplitCalculationResult {
  totalAmountXlm: string;
  totalStroops: number;
  recipientCount: number;
  baseShareStroops: number;
  remainderStroops: number;
  allocations: SplitRecipientAllocation[];
}

export function calculateEqualSplit(totalXlm: number, recipients: string[]): SplitCalculationResult {
  const totalStroops = Math.round(totalXlm * 10000000);
  const count = recipients.length;
  if (count === 0) {
    throw new Error('Recipients list cannot be empty');
  }

  const baseShareStroops = Math.floor(totalStroops / count);
  const remainderStroops = totalStroops % count;

  let allocated = 0;
  const allocations: SplitRecipientAllocation[] = recipients.map((r, i) => {
    const isLast = i === count - 1;
    const share = isLast ? totalStroops - allocated : baseShareStroops;
    allocated += share;
    return {
      recipient: r,
      stroops: share,
      amountXlm: (share / 10000000).toFixed(7),
      isRemainderReceiver: isLast && remainderStroops > 0,
    };
  });

  return {
    totalAmountXlm: totalXlm.toFixed(7),
    totalStroops,
    recipientCount: count,
    baseShareStroops,
    remainderStroops,
    allocations,
  };
}

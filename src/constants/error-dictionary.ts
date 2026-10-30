export interface ContractErrorInfo {
  code: number;
  name: string;
  httpStatus: number;
  userMessage: string;
  action: string;
}

export const CONTRACT_ERRORS: Record<number, ContractErrorInfo> = {
  101: {
    code: 101,
    name: 'PaymentNotFound',
    httpStatus: 404,
    userMessage: 'The requested payment ID was not found on the Stellar Soroban ledger.',
    action: 'Verify the payment ID or transaction hash in your records.',
  },
  102: {
    code: 102,
    name: 'PaymentAlreadyExists',
    httpStatus: 409,
    userMessage: 'A payment record with this unique identifier has already been indexed.',
    action: 'Use a distinct idempotency key or query existing status.',
  },
  103: {
    code: 103,
    name: 'InvalidAmount',
    httpStatus: 400,
    userMessage: 'The payment amount must be greater than zero stroops.',
    action: 'Ensure the amount is positive and does not exceed available balance.',
  },
  104: {
    code: 104,
    name: 'UnauthorizedRole',
    httpStatus: 403,
    userMessage: 'Caller account lacks the required RBAC role for this contract invocation.',
    action: 'Submit transaction from an authorized Admin or Operator keypair.',
  },
  105: {
    code: 105,
    name: 'ContractPaused',
    httpStatus: 503,
    userMessage: 'Contract operations are currently paused by the administrator.',
    action: 'Wait for circuit breaker clearance or contact platform governance.',
  },
  106: {
    code: 106,
    name: 'PaymentExpired',
    httpStatus: 410,
    userMessage: 'This payment authorization window has expired past its valid ledger sequence.',
    action: 'Create a new payment request with updated ledger expiration.',
  },
  107: {
    code: 107,
    name: 'DisputeAlreadyExists',
    httpStatus: 409,
    userMessage: 'An active dispute is already opened for this payment record.',
    action: 'Check arbitrator adjudication dashboard for dispute resolution status.',
  },
  111: {
    code: 111,
    name: 'SharesMismatch',
    httpStatus: 422,
    userMessage: 'Sum of recipient disbursement shares does not match total settlement amount.',
    action: 'Recalculate split shares with deterministic 0-loss Stroop allocation.',
  },
};

export function getContractError(code: number): ContractErrorInfo {
  return (
    CONTRACT_ERRORS[code] || {
      code,
      name: 'UnknownContractError',
      httpStatus: 500,
      userMessage: `Soroban contract reverted with unclassified error code ${code}.`,
      action: 'Check transaction XDR simulation trace on Stellar Expert.',
    }
  );
}

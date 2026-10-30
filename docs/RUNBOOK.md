# Operational Runbook: Incident Response, Pausing & Upgrades

## 1. Emergency Circuit Breaker (Pause Contract)

In the event of an anomalous transaction pattern or suspected zero-day vulnerability:

### Procedure
1. Execute admin pause method on `settlement-router` or `payment-registry`:
   ```bash
   stellar contract invoke --id $PAYMENT_HUB_CONTRACT_ID --source-account $ADMIN_SECRET -- pause
   ```
2. Verify paused state returns `PAUSED`.
3. All new settlement and escrow creation attempts will immediately revert with `ContractError(103): ContractPaused`.

## 2. Unpausing After Triage
```bash
stellar contract invoke --id $PAYMENT_HUB_CONTRACT_ID --source-account $ADMIN_SECRET -- unpause
```

## 3. Storage TTL Maintenance
Execute monthly storage TTL renewals:
```bash
npm run script scripts/contract-upgrade-dryrun.ts
```

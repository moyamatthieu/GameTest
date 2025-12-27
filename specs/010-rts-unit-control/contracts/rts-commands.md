# P2P Contract: RTS Commands

## Message: CommandBroadcast
Sent by a player to all peers in the cluster to initiate an action.

### Payload
`json
{
  "type": "COMMAND_BROADCAST",
  "command": {
    "issuer": "base58_public_key",
    "signature": "ed25519_signature",
    "tick": 12345,
    "sequence": 42,
    "action": "MOVE",
    "units": ["uuid-1", "uuid-2"],
    "target": { "x": 100.0, "y": 0.0, "z": -50.0 },
    "targetId": null
  }
}
`

## Message: CommandValidation
Sent by a validator to confirm the validity of a broadcasted command.

### Payload
`json
{
  "type": "COMMAND_VALIDATION",
  "commandId": "hash_of_command",
  "validator": "validator_public_key",
  "signature": "validator_signature",
  "approved": true
}
`

## Execution Logic
1. **Broadcast**: Player signs and sends CommandBroadcast.
2. **Validation**: Validators check:
   - Signature is valid.
   - Units are owned by issuer.
   - 	ick is in the future.
3. **Consensus**: Once 51% of validators approve, the command is added to the deterministic execution queue.
4. **Execution**: On 	ick, all peers apply the command to the ECS state.

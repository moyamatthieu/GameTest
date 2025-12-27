# P2P Message Contracts

All messages sent over the PeerJS DataChannel MUST follow this structure.

## Base Message Format

```typescript
interface P2PMessage {
  type: string;
  payload: any;
  timestamp: number;
  senderId: string;
  signature?: string; // Reserved for future use (Constitution Principle I)
}
```

## Message Types

### 1. `HEARTBEAT`
Sent periodically to maintain the connection and update `lastSeen`.

```json
{
  "type": "HEARTBEAT",
  "payload": {},
  "timestamp": 1735123456789,
  "senderId": "5Hp..."
}
```

### 2. `CHAT` (Test Message)
Used for User Story 3 to verify communication.

```json
{
  "type": "CHAT",
  "payload": {
    "text": "Hello world!"
  },
  "timestamp": 1735123456789,
  "senderId": "5Hp..."
}
```

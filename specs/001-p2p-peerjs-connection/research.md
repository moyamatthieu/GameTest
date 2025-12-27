# Research: 001-p2p-peerjs-connection

## Unknowns & Research Tasks

### 1. Derivation of PeerJS ID from Ed25519 Public Key
- **Task**: Determine the best encoding for the Ed25519 public key to be used as a PeerJS ID.
- **Findings**: PeerJS IDs must be alphanumeric strings (can include `-` and `_`). Ed25519 public keys are 32 bytes. Base58 (Bitcoin style) or Base64url are good candidates. Base58 is preferred for readability and avoiding ambiguous characters.
- **Decision**: Use Base58 encoding for the 32-byte public key.
- **Rationale**: Compact, alphanumeric, and widely used in decentralized systems (e.g., Solana, IPFS).

### 2. PeerJS ID Security & Proof of Possession
- **Task**: Investigate if PeerJS signaling server allows verifying that a client actually owns the ID they claim.
- **Findings**: The public PeerJS signaling server (`peerjs.com`) does NOT verify ownership of IDs. Anyone can attempt to register any ID. If an ID is already taken, the second client gets an error.
- **Decision**: For this prototype, we accept this limitation. Future iterations will require a custom signaling server that validates a signature during the `open` handshake.
- **Rationale**: Out of scope for the initial P2P connection feature, but documented as a security risk.

### 3. Integration of `tweetnacl` with Vite/TypeScript
- **Task**: Check for compatibility and type definitions.
- **Findings**: `tweetnacl` is well-supported. `@types/tweetnacl` is available. It works fine in browser environments.
- **Decision**: Use `tweetnacl` for Ed25519.
- **Alternatives considered**: `noble-curves` (more modern but slightly larger). `tweetnacl` is sufficient for basic Ed25519.

### 4. E2E Testing of P2P Connections
- **Task**: How to simulate two peers in Playwright.
- **Findings**: Playwright can open multiple browser contexts. We can launch two contexts, get the ID from one, and input it into the other.
- **Decision**: Use Playwright with two separate browser contexts to test the connection flow.

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ID Encoding | Base58 | Compact, alphanumeric, standard in P2P. |
| Crypto Lib | `tweetnacl` | Lightweight, proven, easy to use. |
| Signaling | `peerjs.com` | Zero setup for prototype. |
| E2E Strategy | Multi-context Playwright | Realistic simulation of two independent users. |

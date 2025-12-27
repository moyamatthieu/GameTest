# Quickstart: 001-p2p-peerjs-connection

## Setup

1. Install dependencies:
   ```bash
   npm install peerjs tweetnacl bs58
   npm install -D @types/peerjs @types/tweetnacl
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open the application in two different browser windows (or use Incognito for the second one).
2. **Window A**:
   - Wait for "Status: Online".
   - Copy your "My Peer ID".
3. **Window B**:
   - Paste Window A's ID into the "Connect to Peer" field.
   - Click "Connect".
4. **Verification**:
   - Both windows should show "Status: Connected to [ID]".
   - Type a message in Window B and send it.
   - Window A should display the message.

## Running Tests

- **Unit Tests**: `npm test src/core/identity`
- **Integration Tests**: `npm test src/core/network`
- **E2E Tests**: `npx playwright test tests/e2e/connection.spec.ts`

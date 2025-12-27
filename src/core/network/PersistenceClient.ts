import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface SignedPayload<T> {
  issuer: string; // base58 public key
  signature: string; // base58 detached signature
  tick: number; // client timestamp
  payload: T;
}

export interface WorldSnapshot {
  worldId: string;
  clusterId: string;
  snapshot: unknown;
}

export class PersistenceClient {
  constructor(
    private baseUrl: string,
    private keyPair: nacl.SignKeyPair
  ) {}

  /**
   * Sends a signed snapshot to the persistence server.
   */
  async saveSnapshot(worldId: string, clusterId: string, snapshot: unknown): Promise<void> {
    const tick = Date.now();
    const payload: WorldSnapshot = { worldId, clusterId, snapshot };

    // Canonical message for signature (must match server's canonicalMessageForSignature)
    const message = JSON.stringify({ tick, payload });
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(
      new Uint8Array(messageBytes),
      new Uint8Array(this.keyPair.secretKey)
    );

    const body: SignedPayload<WorldSnapshot> = {
      issuer: bs58.encode(this.keyPair.publicKey),
      signature: bs58.encode(signature),
      tick,
      payload,
    };

    const response = await fetch(`${this.baseUrl}/persistence/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown' }));
      throw new Error(`Failed to save snapshot: ${error.error || response.statusText}`);
    }
  }

  /**
   * Retrieves the latest snapshot for a given world and cluster.
   */
  async getLatestSnapshot(worldId: string, clusterId: string): Promise<WorldSnapshot | null> {
    const url = new URL(`${this.baseUrl}/persistence/snapshot/latest`, window.location.origin);
    // If baseUrl is relative, it will use window.location.origin.
    // If it's absolute, the second arg is ignored.
    const finalUrl = this.baseUrl.startsWith('http')
      ? new URL(`${this.baseUrl}/persistence/snapshot/latest`)
      : new URL(`${this.baseUrl}/persistence/snapshot/latest`, window.location.origin);

    finalUrl.searchParams.set('worldId', worldId);
    finalUrl.searchParams.set('clusterId', clusterId);

    const response = await fetch(finalUrl.toString());
    if (response.status === 404) return null;
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown' }));
      throw new Error(`Failed to fetch latest snapshot: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    // The server returns a StoredSnapshot which contains the signed payload
    return data.signed.payload;
  }

  /**
   * Sends a signed journal entry to the persistence server.
   */
  async appendJournal(worldId: string, clusterId: string, action: unknown): Promise<void> {
    const tick = Date.now();
    const payload = { worldId, clusterId, action };

    const message = JSON.stringify({ tick, payload });
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(
      new Uint8Array(messageBytes),
      new Uint8Array(this.keyPair.secretKey)
    );

    const body: SignedPayload<any> = {
      issuer: bs58.encode(this.keyPair.publicKey),
      signature: bs58.encode(signature),
      tick,
      payload,
    };

    const response = await fetch(`${this.baseUrl}/persistence/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown' }));
      throw new Error(`Failed to append journal: ${error.error || response.statusText}`);
    }
  }
}

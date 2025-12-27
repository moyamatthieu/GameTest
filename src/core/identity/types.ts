export interface Identity {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  peerId: string;
}

export interface IdentityStorage {
  publicKey: string; // Hex encoded
  secretKey: string; // Hex encoded
  peerId: string;
}

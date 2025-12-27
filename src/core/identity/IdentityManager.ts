import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Identity, IdentityStorage } from './types';

export class IdentityManager {
  private static STORAGE_KEY = 'specify_identity';

  static getOrCreateIdentity(): Identity {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data: IdentityStorage = JSON.parse(stored);
        return {
          publicKey: this.hexToUint8Array(data.publicKey),
          secretKey: this.hexToUint8Array(data.secretKey),
          peerId: data.peerId,
        };
      } catch (e) {
        console.error('Failed to parse stored identity, generating new one', e);
      }
    }

    const keyPair = nacl.sign.keyPair();
    const peerId = this.derivePeerId(keyPair.publicKey);
    const identity: Identity = {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
      peerId,
    };

    this.saveIdentity(identity);
    return identity;
  }

  static derivePeerId(publicKey: Uint8Array): string {
    return bs58.encode(publicKey);
  }

  private static saveIdentity(identity: Identity): void {
    const data: IdentityStorage = {
      publicKey: this.uint8ArrayToHex(identity.publicKey),
      secretKey: this.uint8ArrayToHex(identity.secretKey),
      peerId: identity.peerId,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private static uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static hexToUint8Array(hex: string): Uint8Array {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) return new Uint8Array(0);
    return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
  }
}

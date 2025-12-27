import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

export type VerifyInput = {
  issuerPublicKeyBase58: string;
  signatureBase58: string;
  message: string;
};

export function verifyDetachedSignature(input: VerifyInput): boolean {
  try {
    const publicKey = bs58.decode(input.issuerPublicKeyBase58);
    const signature = bs58.decode(input.signatureBase58);
    const messageBytes = new TextEncoder().encode(input.message);

    if (publicKey.length !== nacl.sign.publicKeyLength) return false;
    if (signature.length !== nacl.sign.signatureLength) return false;

    return nacl.sign.detached.verify(
      new Uint8Array(messageBytes),
      new Uint8Array(signature),
      new Uint8Array(publicKey)
    );
  } catch {
    return false;
  }
}

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdentityManager } from '../../../src/core/identity/IdentityManager';
describe('IdentityManager', () => {
    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => { store[key] = value; },
                clear: () => { store = {}; }
            };
        })();
        vi.stubGlobal('localStorage', localStorageMock);
    });
    it('should generate a new identity if none exists', () => {
        const identity = IdentityManager.getOrCreateIdentity();
        expect(identity.peerId).toBeDefined();
        expect(identity.publicKey).toBeDefined();
        expect(identity.secretKey).toBeDefined();
        expect(localStorage.getItem('specify_identity')).toBeDefined();
    });
    it('should load an existing identity from localStorage', () => {
        const firstIdentity = IdentityManager.getOrCreateIdentity();
        const secondIdentity = IdentityManager.getOrCreateIdentity();
        expect(firstIdentity.peerId).toBe(secondIdentity.peerId);
    });
    it('should derive the same peerId from the same keys', () => {
        const identity = IdentityManager.getOrCreateIdentity();
        const peerId = IdentityManager.derivePeerId(identity.publicKey);
        expect(identity.peerId).toBe(peerId);
    });
});
//# sourceMappingURL=IdentityManager.test.js.map
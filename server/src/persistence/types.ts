export type WorldId = string;
export type ClusterId = string;

export type SignedPayload<T> = {
  issuer: string; // base58 public key
  signature: string; // base58 detached signature
  tick: number; // client timestamp
  payload: T;
};

export type WorldSnapshot = {
  worldId: WorldId;
  clusterId: ClusterId;
  snapshot: unknown;
};

export type MutationLogEntry = {
  worldId: WorldId;
  clusterId: ClusterId;
  action: unknown;
};

# Research: Persistence Server & Backup

## 1. Snapshot Storage Format

### Decision
Use JSON for snapshots initially, with Gzip compression if needed.

### Rationale
JSON is natively supported by TypeScript/JavaScript and easy to debug. Since the server is non-authoritative, it doesn't need to parse the content, only store and serve it.

### Alternatives Considered
- **Protocol Buffers**: More compact but adds complexity to the build process and client-side bundle.
- **SQLite**: Good for structured data, but snapshots are large blobs. Filesystem storage is simpler for blob-like data.

## 2. Signature Verification (Ed25519)

### Decision
Use `tweetnacl` for signature verification on the server.

### Rationale
`tweetnacl` is a well-vetted, lightweight library that supports Ed25519. It's already in the project's dependencies.

### Implementation Pattern
The client signs the entire JSON payload (stringified) and sends the signature in a header or as part of a wrapper object.
```typescript
const message = new TextEncoder().encode(payloadString);
const isValid = nacl.sign.detached.verify(message, signature, publicKey);
```

## 3. Rate Limiting

### Decision
Implement a simple memory-based rate limiter.

### Rationale
For a minimal server, a memory-based limiter is sufficient to prevent basic spam/DoS. If the server restarts, the limits reset, which is acceptable for this use case.

### Implementation Pattern
Track requests per IP in a `Map` with a sliding window or fixed window.

## 4. Static File Serving

### Decision
Use `node:fs` and `node:path` to serve files from the `dist/` directory.

### Rationale
Avoids external dependencies like `express` or `serve-static`, keeping the server footprint minimal as per Principle XIII.
```typescript
const filePath = path.join(staticDir, requestPath);
const stream = fs.createReadStream(filePath);
stream.pipe(response);
```

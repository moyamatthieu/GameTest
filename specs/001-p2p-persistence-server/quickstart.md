# Quickstart: Persistence Server

## Server Setup

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and set `DATA_DIR` and `PORT`.

3. **Run the Server**:
   ```bash
   npm run build
   npm start
   ```

## Client Integration

1. **Initialize Persistence Client**:
   ```typescript
   const persistence = new PersistenceClient({
     serverUrl: 'http://localhost:3000',
     identity: myIdentity
   });
   ```

2. **Save a Snapshot**:
   ```typescript
   const snapshot = world.takeSnapshot();
   await persistence.saveSnapshot(clusterId, snapshot);
   ```

3. **Restore State**:
   ```typescript
   const latest = await persistence.getLatestSnapshot(clusterId);
   if (latest) {
     world.loadSnapshot(latest);
   }
   ```

## Testing

Run the smoke tests to verify the API:
```bash
cd server
npm run smoke-test
```

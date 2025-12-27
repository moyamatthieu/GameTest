import { Peer, DataConnection } from 'peerjs';

export class NetworkManager {
    private peer: Peer;
    private connections: Map<string, DataConnection> = new Map();
    public onPeerId: (id: string) => void = () => {};
    public onConnection: (conn: DataConnection) => void = () => {};
    public onData: (data: any, conn: DataConnection) => void = () => {};

    constructor() {
        const LOBBY_ID = 'jeux-gestion-lobby-global';

        // Try to be the lobby first
        this.peer = new Peer(LOBBY_ID);

        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            this.onPeerId(id);
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
                // Lobby ID is taken, so we are a normal peer
                console.log('Lobby already exists, joining as normal peer...');
                this.peer = new Peer();
                this.setupPeerEvents();

                // Wait for peer to be open before connecting to lobby
                this.peer.on('open', () => {
                    this.connect(LOBBY_ID);
                });
            } else {
                console.error('PeerJS error:', err);
            }
        });
    }

    private setupPeerEvents() {
        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            this.onPeerId(id);
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });
    }

    public connect(targetId: string) {
        if (this.connections.has(targetId)) return;
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    private setupConnection(conn: DataConnection) {
        conn.on('open', () => {
            console.log('Connected to: ' + conn.peer);

            // Share existing peers with the new connection
            const peerList = Array.from(this.connections.keys());
            conn.send({ type: 'peer-list', peers: peerList });

            this.connections.set(conn.peer, conn);
            this.onConnection(conn);
        });

        conn.on('data', (data) => {
            this.onData(data, conn);
        });

        conn.on('close', () => {
            console.log('Connection closed: ' + conn.peer);
            this.connections.delete(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.connections.delete(conn.peer);
        });
    }

    public broadcast(data: any) {
        this.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }

    public getPeerId(): string {
        return this.peer.id;
    }

    public getConnectionsCount(): number {
        return this.connections.size;
    }
}

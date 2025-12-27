import { PeerService } from '../../core/network/PeerService';
import { ConnectionManager } from '../../core/network/ConnectionManager';
import { MessageType } from '../../core/network/contracts';

export class NetworkStatusUI {
  private container: HTMLElement;
  private peerService: PeerService;
  private connectionManager: ConnectionManager;

  constructor(containerId: string, peerService: PeerService, connectionManager: ConnectionManager) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;
    this.peerService = peerService;
    this.connectionManager = connectionManager;

    this.render();
    this.setupListeners();
  }

  private setupListeners() {
    this.peerService.onStatusChange(() => this.render());
    this.peerService.onConnection((conn) => {
      this.connectionManager.addConnection(conn);
      this.render();
    });

    this.connectionManager.onMessage((msg) => {
      this.addChatMessage(msg.senderId, msg.payload.text);
    });
  }

  private addChatMessage(senderId: string, text: string) {
    const log = this.container.querySelector('#chat-log');
    if (log) {
      const msgEl = document.createElement('div');
      msgEl.innerHTML = `<strong>${senderId.substring(0, 5)}...</strong>: ${text}`;
      log.appendChild(msgEl);
      log.scrollTop = log.scrollHeight;
    }
  }

  private render() {
    const connections = this.connectionManager.getConnections();
    this.container.innerHTML = `
      <div style="border: 1px solid #ccc; padding: 10px; margin-top: 10px;">
        <h3>Network Status</h3>
        <p>My Peer ID: <span id="peer-id">${this.peerService.getPeerId()}</span></p>
        <p>Status: <span id="status-text">Updating...</span></p>

        <div>
          <input type="text" id="target-peer-id" placeholder="Enter Peer ID to connect" style="width: 250px;" />
          <button id="connect-btn">Connect</button>
        </div>

        <h4>Active Connections (${connections.length})</h4>
        <ul id="connections-list">
          ${connections.map(c => `<li>${c.remotePeerId} (${c.status})</li>`).join('')}
        </ul>

        <div id="chat-section" style="margin-top: 10px; display: ${connections.length > 0 ? 'block' : 'none'};">
          <input type="text" id="chat-input" placeholder="Type a message" />
          <button id="send-btn">Send</button>
          <div id="chat-log" style="height: 100px; overflow-y: auto; border: 1px solid #eee; margin-top: 5px; padding: 5px;"></div>
        </div>
      </div>
    `;

    const connectBtn = this.container.querySelector('#connect-btn');
    connectBtn?.addEventListener('click', () => {
      const input = this.container.querySelector('#target-peer-id') as HTMLInputElement;
      if (input.value) {
        this.peerService.connect(input.value);
      }
    });

    const sendBtn = this.container.querySelector('#send-btn');
    sendBtn?.addEventListener('click', () => {
      const input = this.container.querySelector('#chat-input') as HTMLInputElement;
      const connections = this.connectionManager.getConnections();
      if (input.value && connections.length > 0) {
        const message = {
          type: MessageType.CHAT,
          payload: { text: input.value },
          timestamp: Date.now(),
          senderId: this.peerService.getPeerId(),
        };

        connections.forEach(c => {
          this.peerService.sendMessage(c.remotePeerId, message);
        });

        this.addChatMessage('Me', input.value);
        input.value = '';
      }
    });
  }
}

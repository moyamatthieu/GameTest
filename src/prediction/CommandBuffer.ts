export interface Command {
  id: string;
  type: string;
  data: any;
  entityId: number | null;
  timestamp: number;
  stateBefore?: any;
  status: 'pending' | 'confirmed' | 'rejected';
  tick: number;
  confirmedTick?: number;
  serverData?: any;
  _bufferAdded?: number;
  _retryCount?: number;
  _lastRetry?: number | null;
  _statusUpdated?: number;
}

export class CommandBuffer {
  private commands: Map<string, Command>;
  private confirmedCommands: Map<string, Command>;
  private rejectedCommands: Map<string, Command>;
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize = 100, maxAge = 30000) {
    this.commands = new Map();
    this.confirmedCommands = new Map();
    this.rejectedCommands = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  add(command: Command): void {
    if (this.commands.size >= this.maxSize) {
      this.cleanupOldest();
    }

    const enrichedCommand: Command = {
      ...command,
      _bufferAdded: Date.now(),
      _retryCount: 0,
      _lastRetry: null
    };

    this.commands.set(command.id, enrichedCommand);

    if (this.commands.size % 10 === 0) {
      this.cleanupExpired();
    }
  }

  get(commandId: string): Command | null {
    return this.commands.get(commandId) || null;
  }

  updateStatus(commandId: string, status: 'confirmed' | 'rejected' | 'pending', serverData: any = {}): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;

    command.status = status;
    command.serverData = serverData;
    command._statusUpdated = Date.now();

    if (status === 'confirmed') {
      this.confirmedCommands.set(commandId, command);
      this.commands.delete(commandId);
    } else if (status === 'rejected') {
      this.rejectedCommands.set(commandId, command);
      this.commands.delete(commandId);
    }

    return true;
  }

  remove(commandId: string): void {
    this.commands.delete(commandId);
    this.confirmedCommands.delete(commandId);
    this.rejectedCommands.delete(commandId);
  }

  getPendingCommands(): Command[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.status === 'pending');
  }

  getExpiredCommands(): Command[] {
    const now = Date.now();
    return Array.from(this.commands.values()).filter(cmd => (now - cmd.timestamp) > this.maxAge);
  }

  cleanupExpired(): number {
    const expired = this.getExpiredCommands();
    expired.forEach(cmd => {
      this.commands.delete(cmd.id);
    });
    return expired.length;
  }

  private cleanupOldest(): void {
    const commands = Array.from(this.commands.values());
    if (commands.length === 0) return;

    commands.sort((a, b) => a.timestamp - b.timestamp);

    const toRemove = Math.max(1, Math.floor(commands.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.commands.delete(commands[i].id);
    }
  }

  getStats(): any {
    const now = Date.now();
    const pending = Array.from(this.commands.values());
    const confirmed = Array.from(this.confirmedCommands.values());

    const avgLatency = confirmed.length > 0
      ? confirmed.reduce((sum, cmd) => {
          const latency = (cmd._statusUpdated || now) - cmd.timestamp;
          return sum + latency;
        }, 0) / confirmed.length
      : 0;

    return {
      total: this.commands.size + confirmed.length + this.rejectedCommands.size,
      pending: this.commands.size,
      confirmed: confirmed.length,
      rejected: this.rejectedCommands.size,
      avgLatency: Math.round(avgLatency)
    };
  }

  clear(): void {
    this.commands.clear();
    this.confirmedCommands.clear();
    this.rejectedCommands.clear();
  }
}

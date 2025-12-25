export type EventCallback = (data: any) => void;
export type GlobalEventCallback = (eventName: string, data: any) => void;

interface Listener {
  callback: EventCallback;
  context: any;
  once: boolean;
}

export class EventBus {
  private listeners: Map<string, Set<Listener>>;
  private globalListeners: Set<GlobalEventCallback>;

  constructor() {
    this.listeners = new Map();
    this.globalListeners = new Set();
  }

  on(eventName: string, callback: EventCallback, context: any = null): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listener: Listener = {
      callback,
      context,
      once: false
    };

    this.listeners.get(eventName)!.add(listener);

    return () => this.off(eventName, callback);
  }

  once(eventName: string, callback: EventCallback, context: any = null): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listener: Listener = {
      callback,
      context,
      once: true
    };

    this.listeners.get(eventName)!.add(listener);
  }

  onAll(callback: GlobalEventCallback): () => void {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  off(eventName: string, callback: EventCallback): void {
    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName)!;
    for (const listener of listeners) {
      if (listener.callback === callback) {
        listeners.delete(listener);
        break;
      }
    }

    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit(eventName: string, data: any = null): void {
    for (const callback of this.globalListeners) {
      try {
        callback(eventName, data);
      } catch (error) {
        console.error(`Global listener error for event "${eventName}":`, error);
      }
    }

    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName)!;
    const toRemove: Listener[] = [];

    for (const listener of listeners) {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }

        if (listener.once) {
          toRemove.push(listener);
        }
      } catch (error) {
        console.error(`Listener error for event "${eventName}":`, error);
      }
    }

    for (const listener of toRemove) {
      listeners.delete(listener);
    }

    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  clear(eventName: string): void {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName)!.clear();
      this.listeners.delete(eventName);
    }
  }

  clearAll(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }

  listenerCount(eventName: string): number {
    if (!this.listeners.has(eventName)) return 0;
    return this.listeners.get(eventName)!.size;
  }

  hasListeners(eventName: string): boolean {
    return this.listenerCount(eventName) > 0;
  }
}

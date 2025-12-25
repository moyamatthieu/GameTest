export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.globalListeners = new Set();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to listen to
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} [context] - Optional context to bind the callback to
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, context = null) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listener = {
      callback,
      context,
      once: false
    };

    this.listeners.get(eventName).add(listener);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName - Name of the event to listen to
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} [context] - Optional context to bind the callback to
   */
  once(eventName, callback, context = null) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listener = {
      callback,
      context,
      once: true
    };

    this.listeners.get(eventName).add(listener);
  }

  /**
   * Subscribe to all events
   * @param {Function} callback - Function to call when any event is emitted
   * @returns {Function} Unsubscribe function
   */
  onAll(callback) {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName);
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

  /**
   * Emit an event
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Data to pass to listeners
   */
  emit(eventName, data = null) {
    // Call global listeners
    for (const callback of this.globalListeners) {
      try {
        callback(eventName, data);
      } catch (error) {
        console.error(`Global listener error for event "${eventName}":`, error);
      }
    }

    // Call specific listeners
    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName);
    const toRemove = [];

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

    // Remove once listeners
    for (const listener of toRemove) {
      listeners.delete(listener);
    }

    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Clear all listeners for a specific event
   * @param {string} eventName - Name of the event
   */
  clear(eventName) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).clear();
      this.listeners.delete(eventName);
    }
  }

  /**
   * Clear all listeners
   */
  clearAll() {
    this.listeners.clear();
    this.globalListeners.clear();
  }

  /**
   * Get the number of listeners for an event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    if (!this.listeners.has(eventName)) return 0;
    return this.listeners.get(eventName).size;
  }

  /**
   * Check if an event has any listeners
   * @param {string} eventName - Name of the event
   * @returns {boolean} True if event has listeners
   */
  hasListeners(eventName) {
    return this.listenerCount(eventName) > 0;
  }
}

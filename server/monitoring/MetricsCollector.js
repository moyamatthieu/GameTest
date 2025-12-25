import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Collecteur de métriques de performance pour le serveur de jeu
 * Monitorise les performances, génère des rapports et émet des alertes
 */
export class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();

    this.enabled = options.enabled !== false;
    this.reportInterval = options.reportInterval || 60000; // 1 minute
    this.alertThresholds = {
      tickDuration: options.tickDurationThreshold || 50, // ms
      latency: options.latencyThreshold || 200, // ms
      memoryUsage: options.memoryUsageThreshold || 0.9, // 90%
      activeEntities: options.activeEntitiesThreshold || 10000,
      ...options.alertThresholds
    };

    this.metrics = {
      startTime: Date.now(),
      ticks: 0,
      tickDurations: [],
      averageTickDuration: 0,
      maxTickDuration: 0,
      minTickDuration: Infinity,
      activeEntities: 0,
      connectedPlayers: 0,
      networkLatency: [],
      averageLatency: 0,
      memoryUsage: [],
      averageMemoryUsage: 0,
      errors: [],
      warnings: [],
      alerts: [],
      networkMetrics: {
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        compressionRatio: 0
      },
      gameMetrics: {
        buildingsPlaced: 0,
        shipsCreated: 0,
        battlesFought: 0,
        economyUpdates: 0
      }
    };

    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 1440; // 24 hours at 1 minute intervals

    this.reportTimer = null;
    this.isShuttingDown = false;

    this.outputDir = options.outputDir || './monitoring';
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Démarrer la collecte de métriques
   */
  start() {
    if (!this.enabled) return;

    console.log('[MetricsCollector] Starting metrics collection...');

    this.reportTimer = setInterval(() => {
      this.generateReport();
    }, this.reportInterval);

    // Capturer les événements de process
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    this.emit('started');
  }

  /**
   * Arrêter la collecte
   */
  stop() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    this.generateReport(true); // Final report
    this.emit('stopped');
  }

  /**
   * Enregistrer la durée d'un tick
   */
  recordTick(duration) {
    if (!this.enabled) return;

    this.metrics.ticks++;
    this.metrics.tickDurations.push(duration);

    // Garder seulement les 100 dernières valeurs pour la moyenne
    if (this.metrics.tickDurations.length > 100) {
      this.metrics.tickDurations.shift();
    }

    this.metrics.averageTickDuration =
      this.metrics.tickDurations.reduce((a, b) => a + b, 0) /
      this.metrics.tickDurations.length;

    this.metrics.maxTickDuration = Math.max(this.metrics.maxTickDuration, duration);
    this.metrics.minTickDuration = Math.min(this.metrics.minTickDuration, duration);

    // Vérifier les alertes
    if (duration > this.alertThresholds.tickDuration) {
      this.triggerAlert('tick_duration', `Tick duration exceeded threshold: ${duration.toFixed(2)}ms`, duration);
    }
  }

  /**
   * Enregistrer le nombre d'entités actives
   */
  recordActiveEntities(count) {
    if (!this.enabled) return;

    this.metrics.activeEntities = count;

    if (count > this.alertThresholds.activeEntities) {
      this.triggerAlert('active_entities', `Active entities exceeded threshold: ${count}`, count);
    }
  }

  /**
   * Enregistrer le nombre de joueurs connectés
   */
  recordConnectedPlayers(count) {
    if (!this.enabled) return;

    this.metrics.connectedPlayers = count;
  }

  /**
   * Enregistrer la latence réseau
   */
  recordLatency(playerId, latency) {
    if (!this.enabled) return;

    this.metrics.networkLatency.push(latency);

    // Garder les 1000 dernières valeurs
    if (this.metrics.networkLatency.length > 1000) {
      this.metrics.networkLatency.shift();
    }

    this.metrics.averageLatency =
      this.metrics.networkLatency.reduce((a, b) => a + b, 0) /
      this.metrics.networkLatency.length;

    if (latency > this.alertThresholds.latency) {
      this.triggerAlert('latency', `High latency for player ${playerId}: ${latency}ms`, latency);
    }
  }

  /**
   * Enregistrer l'utilisation mémoire
   */
  recordMemoryUsage() {
    if (!this.enabled) return;

    const memUsage = process.memoryUsage();
    const usageRatio = memUsage.heapUsed / memUsage.heapTotal;

    this.metrics.memoryUsage.push(usageRatio);

    // Garder les 100 dernières valeurs
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }

    this.metrics.averageMemoryUsage =
      this.metrics.memoryUsage.reduce((a, b) => a + b, 0) /
      this.metrics.memoryUsage.length;

    if (usageRatio > this.alertThresholds.memoryUsage) {
      this.triggerAlert('memory_usage', `High memory usage: ${(usageRatio * 100).toFixed(2)}%`, usageRatio);
    }
  }

  /**
   * Enregistrer les métriques réseau
   */
  recordNetworkMetrics(metrics) {
    if (!this.enabled) return;

    this.metrics.networkMetrics = {
      ...this.metrics.networkMetrics,
      ...metrics
    };
  }

  /**
   * Enregistrer les métriques de jeu
   */
  recordGameMetric(metric, value) {
    if (!this.enabled) return;

    if (this.metrics.gameMetrics[metric] !== undefined) {
      this.metrics.gameMetrics[metric] += value;
    }
  }

  /**
   * Enregistrer une erreur
   */
  recordError(error, context = {}) {
    if (!this.enabled) return;

    const errorEntry = {
      timestamp: Date.now(),
      message: error.message || String(error),
      stack: error.stack,
      context
    };

    this.metrics.errors.push(errorEntry);

    // Garder les 100 dernières erreurs
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    this.emit('error', errorEntry);
  }

  /**
   * Enregistrer un avertissement
   */
  recordWarning(message, context = {}) {
    if (!this.enabled) return;

    const warningEntry = {
      timestamp: Date.now(),
      message,
      context
    };

    this.metrics.warnings.push(warningEntry);

    // Garder les 100 derniers avertissements
    if (this.metrics.warnings.length > 100) {
      this.metrics.warnings.shift();
    }

    this.emit('warning', warningEntry);
  }

  /**
   * Déclencher une alerte
   */
  triggerAlert(type, message, value) {
    if (!this.enabled) return;

    const alert = {
      timestamp: Date.now(),
      type,
      message,
      value,
      metrics: { ...this.metrics }
    };

    this.metrics.alerts.push(alert);

    // Garder les 50 dernières alertes
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts.shift();
    }

    this.emit('alert', alert);

    // Log l'alerte
    console.warn(`[ALERT] ${message}`);
  }

  /**
   * Générer un rapport
   */
  generateReport(isFinal = false) {
    if (!this.enabled) return;

    this.recordMemoryUsage();

    const report = {
      timestamp: Date.now(),
      isFinal,
      uptime: Date.now() - this.metrics.startTime,
      ...this.metrics
    };

    // Ajouter à l'historique
    this.history.push(report);

    // Limiter la taille de l'historique
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Générer le rapport formaté
    const formattedReport = this.formatReport(report);

    // Afficher dans la console
    console.log('\n' + '='.repeat(80));
    console.log(`[MetricsCollector] Report - ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    console.log(formattedReport);
    console.log('='.repeat(80) + '\n');

    // Sauvegarder dans un fichier
    this.saveReportToFile(report);

    this.emit('report', report);
  }

  /**
   * Formater le rapport pour l'affichage
   */
  formatReport(report) {
    const uptimeHours = Math.floor(report.uptime / 3600000);
    const uptimeMinutes = Math.floor((report.uptime % 3600000) / 60000);

    return `
Performance Metrics:
  Uptime: ${uptimeHours}h ${uptimeMinutes}m
  Ticks: ${report.ticks.toLocaleString()}
  Tick Performance:
    Average: ${report.averageTickDuration.toFixed(2)}ms
    Min: ${report.minTickDuration === Infinity ? 0 : report.minTickDuration.toFixed(2)}ms
    Max: ${report.maxTickDuration.toFixed(2)}ms

Game State:
  Active Entities: ${report.activeEntities.toLocaleString()}
  Connected Players: ${report.connectedPlayers}

Network Metrics:
  Average Latency: ${report.averageLatency.toFixed(2)}ms
  Bytes Sent: ${this.formatBytes(report.networkMetrics.bytesSent)}
  Bytes Received: ${this.formatBytes(report.networkMetrics.bytesReceived)}
  Packets Sent: ${report.networkMetrics.packetsSent.toLocaleString()}
  Packets Received: ${report.networkMetrics.packetsReceived.toLocaleString()}
  Compression Ratio: ${report.networkMetrics.compressionRatio}

Memory Usage:
  Average: ${(report.averageMemoryUsage * 100).toFixed(2)}%

Game Metrics:
  Buildings Placed: ${report.gameMetrics.buildingsPlaced}
  Ships Created: ${report.gameMetrics.shipsCreated}
  Battles Fought: ${report.gameMetrics.battlesFought}
  Economy Updates: ${report.gameMetrics.economyUpdates}

Issues:
  Errors: ${report.errors.length}
  Warnings: ${report.warnings.length}
  Alerts: ${report.alerts.length}
`;
  }

  /**
   * Formater les octets en unités lisibles
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sauvegarder le rapport dans un fichier
   */
  saveReportToFile(report) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `metrics-report-${timestamp}.json`;
      const filepath = join(this.outputDir, filename);

      writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');

      // Sauvegarder également un fichier "latest" toujours à jour
      const latestFilepath = join(this.outputDir, 'metrics-latest.json');
      writeFileSync(latestFilepath, JSON.stringify(report, null, 2), 'utf8');

    } catch (error) {
      console.error('[MetricsCollector] Failed to save report to file:', error);
    }
  }

  /**
   * Obtenir les métriques courantes
   */
  getCurrentMetrics() {
    return { ...this.metrics };
  }

  /**
   * Obtenir l'historique des rapports
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Obtenir les alertes récentes
   */
  getRecentAlerts(count = 10) {
    return this.metrics.alerts.slice(-count);
  }

  /**
   * Arrêt propre
   */
  shutdown() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('[MetricsCollector] Shutting down...');

    this.stop();

    // Sauvegarder l'historique complet
    try {
      const historyFilepath = join(this.outputDir, 'metrics-history.json');
      writeFileSync(historyFilepath, JSON.stringify(this.history, null, 2), 'utf8');
      console.log('[MetricsCollector] History saved to', historyFilepath);
    } catch (error) {
      console.error('[MetricsCollector] Failed to save history:', error);
    }

    process.exit(0);
  }
}

/**
 * Exporter une instance singleton
 */
export const metricsCollector = new MetricsCollector();

// Démarrer automatiquement si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  metricsCollector.start();

  // Simuler quelques métriques pour le test
  setInterval(() => {
    metricsCollector.recordTick(16 + Math.random() * 5);
    metricsCollector.recordActiveEntities(Math.floor(Math.random() * 5000));
    metricsCollector.recordConnectedPlayers(Math.floor(Math.random() * 10));
    metricsCollector.recordLatency('test-player', 50 + Math.random() * 100);
    metricsCollector.recordNetworkMetrics({
      bytesSent: Math.floor(Math.random() * 100000),
      bytesReceived: Math.floor(Math.random() * 100000),
      packetsSent: Math.floor(Math.random() * 1000),
      packetsReceived: Math.floor(Math.random() * 1000),
      compressionRatio: (Math.random() * 50 + 20).toFixed(2) + '%'
    });
  }, 1000);
}

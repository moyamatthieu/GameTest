// Serveur relais Gun.js local
const Gun = require('gun');
const http = require('http');

const PORT = 8765;

// Créer serveur HTTP
const server = http.createServer();

// Attacher Gun.js au serveur
const gun = Gun({ web: server });

server.listen(PORT, () => {
  console.log(`🔫 Relais Gun.js démarré sur http://localhost:${PORT}`);
  console.log('Les clients peuvent maintenant se connecter au réseau P2P local');
});

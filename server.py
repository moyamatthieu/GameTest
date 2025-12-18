#!/usr/bin/env python3
"""
SSV CORE - Serveur HTTP + Backup API
Sert les fichiers statiques + gère la sauvegarde du monde
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import urlparse

BACKUP_FILE = 'world-backup.json'
PORT = 8080

class SSVHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        
        # API: Charger le backup
        if parsed.path == '/api/backup':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if os.path.exists(BACKUP_FILE):
                with open(BACKUP_FILE, 'r') as f:
                    data = f.read()
                    self.wfile.write(data.encode())
                    backup = json.loads(data)
                    print(f"📦 Backup chargé ({len(backup.get('world', []))} entités)")
            else:
                empty = json.dumps({'world': [], 'timestamp': 0, 'author': None})
                self.wfile.write(empty.encode())
                print('ℹ️  Aucun backup, monde vide')
        
        # API: Stats
        elif parsed.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if os.path.exists(BACKUP_FILE):
                with open(BACKUP_FILE, 'r') as f:
                    backup = json.load(f)
                    size = os.path.getsize(BACKUP_FILE)
                    stats = {
                        'exists': True,
                        'entities': len(backup.get('world', [])),
                        'savedAt': backup.get('savedAt'),
                        'author': backup.get('author'),
                        'fileSize': f"{size / 1024:.2f} KB"
                    }
                    self.wfile.write(json.dumps(stats).encode())
            else:
                self.wfile.write(json.dumps({'exists': False}).encode())
        
        # Fichiers statiques (index.html, etc.)
        else:
            super().do_GET()
    
    def do_POST(self):
        # API: Sauvegarder le backup
        if self.path == '/api/backup':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode())
                
                # Ajouter timestamp de sauvegarde
                from datetime import datetime
                data['savedAt'] = datetime.now().isoformat()
                
                with open(BACKUP_FILE, 'w') as f:
                    json.dump(data, f, indent=2)
                
                print(f"✅ Backup sauvegardé par {data.get('author')} ({len(data.get('world', []))} entités)")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Backup saved'}).encode())
            
            except Exception as e:
                print(f"❌ Erreur sauvegarde: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), SSVHandler)
    print(f"\n🚀 Serveur SSV CORE démarré sur http://localhost:{PORT}")
    print(f"   📁 Fichiers statiques : /")
    print(f"   💾 Sauvegarde : POST /api/backup")
    print(f"   📥 Chargement : GET /api/backup")
    print(f"   📊 Stats      : GET /api/stats\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Serveur arrêté")

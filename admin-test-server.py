#!/usr/bin/env python3
"""
Servidor específico para test de administrador
Sirve la página de test y redirecciona APIs al servidor principal
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class AdminTestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Manejar requests GET"""
        parsed_path = urlparse(self.path)
        
        # Ruta raíz sirve la página de test
        if parsed_path.path == '/' or parsed_path.path == '':
            self.serve_admin_test()
        # API requests redirigir al servidor principal
        elif parsed_path.path.startswith('/api'):
            self.redirect_to_main_server()
        # Otros archivos normalmente
        else:
            super().do_GET()
    
    def do_POST(self):
        """Manejar requests POST - redirigir APIs"""
        if self.path.startswith('/api'):
            self.redirect_to_main_server()
        else:
            self.send_error(404, "Not found")
    
    def serve_admin_test(self):
        """Servir la página de test de admin"""
        try:
            with open('admin-test.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Actualizar la URL del servidor principal
            content = content.replace(
                "const API_BASE = '/api';",
                "const API_BASE = 'https://3001-ief8rordhys274niuhzre-6532622b.e2b.dev/api';"
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content.encode('utf-8'))))
            # CORS para permitir requests al servidor principal
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, "Admin test page not found")
    
    def redirect_to_main_server(self):
        """Redirigir API calls al servidor principal"""
        self.send_response(302)
        self.send_header('Location', f'https://3001-ief8rordhys274niuhzre-6532622b.e2b.dev{self.path}')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Log personalizado"""
        sys.stdout.write(f"🧪 {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def start_admin_test_server():
    """Iniciar servidor de test de admin"""
    port = 8002
    
    # Cambiar al directorio correcto
    os.chdir('/home/user/webapp')
    
    print(f"🧪 Iniciando CTeI-Manager Admin Test Server...")
    print(f"📁 Directorio: {os.getcwd()}")
    print(f"🌐 Servidor en puerto {port}")
    print(f"🔗 Test Admin: http://0.0.0.0:{port}")
    print(f"🔑 Credenciales: admin@demo.com / admin123")
    print(f"🏗️ API Backend: https://3001-ief8rordhys274niuhzre-6532622b.e2b.dev")
    print("=" * 60)
    
    try:
        with socketserver.TCPServer(("0.0.0.0", port), AdminTestHandler) as httpd:
            print(f"✅ Servidor admin test iniciado")
            print(f"🎯 Página de test disponible en http://0.0.0.0:{port}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Puerto {port} ya está en uso")
            print("🔧 Ejecuta: sudo fuser -k 8002/tcp")
        else:
            print(f"❌ Error al iniciar servidor: {e}")

if __name__ == '__main__':
    start_admin_test_server()
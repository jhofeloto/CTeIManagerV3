#!/usr/bin/env python3
"""
Servidor simple para demostrar CTeI-Manager
Sirve la página de demo y archivos estáticos
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CTeiDemoHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Manejar requests GET"""
        parsed_path = urlparse(self.path)
        
        # Ruta raíz sirve la demo
        if parsed_path.path == '/' or parsed_path.path == '':
            self.serve_demo_page()
        # Servir archivos estáticos normalmente
        else:
            super().do_GET()
    
    def serve_demo_page(self):
        """Servir la página de demo"""
        try:
            with open('demo-ctei-manager.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, "Demo page not found")
    
    def log_message(self, format, *args):
        """Log personalizado"""
        sys.stdout.write(f"🌐 {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def start_demo_server():
    """Iniciar servidor de demo"""
    port = 8000
    
    # Cambiar al directorio correcto
    os.chdir('/home/user/webapp')
    
    print(f"🚀 Iniciando CTeI-Manager Demo Server...")
    print(f"📁 Directorio: {os.getcwd()}")
    print(f"🌐 Servidor ejecutándose en puerto {port}")
    print(f"🔗 Acceso local: http://localhost:{port}")
    print(f"✅ Credenciales Admin: admin@demo.com / admin123")
    print(f"👨‍🔬 Credenciales Investigador: investigador@demo.com / investigador123")
    print(f"🧪 Testing URL: https://main.ctei-manager-testing.pages.dev")
    print("=" * 60)
    
    try:
        with socketserver.TCPServer(("0.0.0.0", port), CTeiDemoHandler) as httpd:
            print(f"✅ Servidor iniciado exitosamente")
            print(f"🎯 Sirviendo demo de CTeI-Manager en http://0.0.0.0:{port}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Puerto {port} ya está en uso")
            print("🔧 Ejecuta: sudo fuser -k 8000/tcp")
        else:
            print(f"❌ Error al iniciar servidor: {e}")

if __name__ == '__main__':
    start_demo_server()
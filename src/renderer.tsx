import { jsxRenderer } from 'hono/jsx-renderer';

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Choco Inventa - CODECTI Chocó</title>
        <meta name="description" content="Choco Inventa: Plataforma de innovación y conocimiento para proyectos de Ciencia, Tecnología e Innovación del Chocó" />
        
        {/* TailwindCSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* FontAwesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom styles */}
        <link href="/static/styles.css" rel="stylesheet" />
        
        {/* Configure Tailwind */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    codecti: {
                      primary: '#2563eb',
                      secondary: '#1e40af',
                      accent: '#3b82f6',
                      success: '#059669',
                      warning: '#d97706',
                      danger: '#dc2626'
                    }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 font-sans">
        {children}
        
        {/* Axios for HTTP requests */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        {/* Logo Manager */}
        <script src="/static/logo-manager.js"></script>
        
        {/* Notifications system - HU-17 */}
        <script src="/static/notifications.js"></script>
        
        {/* Main application JavaScript */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  );
});

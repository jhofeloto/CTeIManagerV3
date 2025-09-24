import { defineConfig } from 'vite';
import pages from '@hono/vite-cloudflare-pages';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [pages()],

    // Configuración del servidor de desarrollo
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: {
        port: 3001,
      },
      // Optimizar recarga en desarrollo
      watch: {
        usePolling: true,
        interval: 300
      }
    },

    // Configuración de preview
    preview: {
      port: 3000,
      host: '0.0.0.0'
    },

    // Configuración de build optimizada
    build: {
      outDir: 'dist',
      target: 'es2020', // Compatible con Cloudflare Workers
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction, // Solo sourcemaps en desarrollo

      // Optimización de chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar dependencias de Hono
            'hono-core': ['hono', 'hono/jsx', 'hono/middleware'],
            'hono-cloudflare': ['@hono/vite-cloudflare-pages'],

            // Utilidades del sistema
            'utils': [
              './src/utils/auth',
              './src/utils/files',
              './src/utils/middleware',
              './src/utils/cache',
              './src/utils/mlService'
            ],

            // Sistema de monitoreo
            'monitoring': [
              './src/monitoring/logger',
              './src/monitoring/errorHandler',
              './src/monitoring/performance',
              './src/monitoring/systemLogger'
            ],

            // Rutas principales
            'routes-auth': ['./src/routes/auth'],
            'routes-projects': ['./src/routes/projects'],
            'routes-public': ['./src/routes/public'],

            // Tipos y definiciones
            'types': ['./src/types']
          },

          // Optimización de nombres de archivos
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },

        // Excluir dependencias externas del bundle
        external: isProduction ? [
          'cloudflare:workers'
        ] : []
      },

      // Límites de chunks
      chunkSizeWarningLimit: 1000, // 1MB warning

      // Optimizaciones de Terser para producción
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,    // Eliminar console.logs
          drop_debugger: true,   // Eliminar debugger statements
          pure_funcs: ['console.log', 'console.info'], // Eliminar funciones específicas
          passes: 2,             // Múltiples pasadas de optimización
          unsafe: true,          // Aplicar optimizaciones unsafe pero efectivas
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true
        },
        mangle: {
          safari10: true         // Soporte para Safari 10+
        },
        format: {
          comments: false        // Eliminar comentarios
        }
      } : undefined
    },

    // Optimización de dependencias
    optimizeDeps: {
      include: [
        'hono',
        'hono/jsx',
        'hono/middleware',
        '@cloudflare/workers-types'
      ],
      exclude: [
        'cloudflare:workers' // Excluir de pre-bundle
      ]
    },

    // Configuración específica para Cloudflare Pages
    cloudflare: {
      pages: {
        buildOutputDirectory: 'dist',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: {
          'DB': 'codecti-production'
        }
      }
    },

    // Variables de entorno
    define: {
      __PRODUCTION__: isProduction,
      __DEV__: !isProduction,
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },

    // Configuración de CSS
    css: {
      devSourcemap: !isProduction,
      postcss: {
        plugins: [
          // PostCSS plugins si es necesario
        ]
      }
    },

    // Configuración de ESBuild (para desarrollo)
    esbuild: {
      target: 'es2020',
      minify: false, // No minificar en desarrollo
      sourcemap: !isProduction,
      define: {
        __DEV__: !isProduction
      }
    }
  };
});

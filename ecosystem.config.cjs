// CODECTI Platform - PM2 Configuration for Sandbox Development

module.exports = {
  apps: [
    {
      name: 'codecti-platform',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=codecti-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reloading)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/user/webapp/logs/error.log',
      out_file: '/home/user/webapp/logs/out.log',
      log_file: '/home/user/webapp/logs/combined.log'
    }
  ]
};
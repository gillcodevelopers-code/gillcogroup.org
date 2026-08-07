// PM2 config for Hostinger VPS (or any Node VPS)
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'gillco-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      cwd: '/var/www/gillco',
      instances: 1,          // set to 'max' if VPS has 2+ CPU cores
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/gillco/err.log',
      out_file: '/var/log/gillco/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};

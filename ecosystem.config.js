// PM2 config for Hostinger VPS.
//   pm2 startOrReload ecosystem.config.js && pm2 save
// Next.js reads .env.production from this folder automatically.
module.exports = {
  apps: [
    {
      name: 'gillco-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: '/var/log/gillco/err.log',
      out_file: '/var/log/gillco/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};

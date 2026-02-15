module.exports = {
  apps: [
    {
      name: 'mikkystream',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/mikkystream',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};

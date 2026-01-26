module.exports = {
  apps: [
    {
      name: 'mikkystream',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/mikkystream',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};

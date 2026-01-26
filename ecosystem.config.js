module.exports = {
  apps: [
    {
      name: 'mikkystream',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/mikkystream',
      interpreter: '/root/.local/share/fnm/node-versions/v24.13.0/installation/bin/node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PATH: '/root/.local/share/fnm/node-versions/v24.13.0/installation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

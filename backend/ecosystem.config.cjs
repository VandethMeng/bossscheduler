module.exports = {
  apps: [
    {
      name: 'boss-scheduler-api',
      script: 'dist/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};

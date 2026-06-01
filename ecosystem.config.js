module.exports = {
  apps: [
    {
      name: 'cau-fix-backend',
      script: 'backend/src/app.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

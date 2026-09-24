module.exports = {
  apps: [
    {
      name: 'wizbilling',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Jangan restart proses saat ada perubahan database atau file upload
      ignore_watch: [
        'node_modules',
        'data',
        'public/uploads',
        'backups',
        'logs',
        '.git',
      ],
      // Konfigurasi log
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-output.log',
      merge_logs: true,
      time: true,
    },
  ],
};

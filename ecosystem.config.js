module.exports = {
  apps: [
    {
      name: "cc",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "--loader ts-node/esm",
      cwd: "/home/ubuntu/course",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
      // Auto restart on crash
      autorestart: true,
      // Watch for changes (optional, disable in production)
      watch: false,
      // Max memory usage
      max_memory_restart: "2G",
      // Logging
      error_file: "/home/ubuntu/.pm2/logs/cc-error.log",
      out_file: "/home/ubuntu/.pm2/logs/cc-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart delay
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};


module.exports = {
    apps: [
        {
            name: "lmo-dv",
            script: "main.js",
            interpreter: "nodejs",
            watch: true,
            ignore_watch: ["node_modules", "logs"],
            exec_mode: "fork",
            instances: 3,
            max_memory_restart: 6,
            error_file: "./logs/app-err.log",
            out_file: "./logs/app-out.log",
            merge_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm:ss",   // 指定日志文件的时间格式
            min_uptime: "60s",
            max_restarts: 30,
            autorestart: true,
            restart_delay: "10s"
        }
    ]
}
export default {
    apps: [
        {
            name: '<Projektname>',
            script: 'src/index.js',
            watch: true,
            ignore_watch: ['node_modules', 'logs', 'cache', 'temp', '.git', 'assets'],
            instances: '2',
            exec_mode: 'cluster',
            autorestart: true,
            shutdown_with_message: process.platform === 'win32',
            wait_ready: true,
            kill_timeout: 10000,
            listen_timeout: 10000,
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            pmx: false
        }
    ]
};

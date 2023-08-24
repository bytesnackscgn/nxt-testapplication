module.exports = {
	apps: [
		{
			name: 'nxt-testapplication',
			port: 3015,
			//instances: '1',
			exec_mode: 'fork',
			script: './dist/index.js',
			env: {
				CONFIG_PATH: '/home/nxt-testapplication/.env.developement',
				NODE_ENV: 'developement',
			},
			autorestart: true,
			watch: false,
			max_old_space_size: '2048M',
			max_memory_restart: '1800M',
			out_file: './pm2-log/out.log',
			error_file: './pm2-log/error.log',
			log_file: './pm2-log/log.log',
			log_type: 'json',
			log_date_format: 'DD-MM-YYYY hh:mm',
		},
	],
};

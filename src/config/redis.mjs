import { env } from './env.mjs';

export const config = {
	host: env.REDIS_HOST,
	//no_ready_check: true,
	//auth_pass: env.REDIS_PASSWORD,
	db: 0,
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
};

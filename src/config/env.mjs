import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*
const __filename = path.resolve(import.meta.url); // Resolve the URL to a file path
const __dirname = path.dirname(__filename);
*/

let envPath;

if (process.env.NODE_ENV === 'production') {
	envPath = '../.env.production';
} else if (process.env.NODE_ENV === 'staging') {
	envPath = '../.env.staging';
} else {
	envPath = '../.env.development';
}

dotenv.config({ path: path.resolve(__dirname, envPath) });

export const requiredEnvKeys = [
	'PUBLIC_URL',
	'REDIS_HOST',
	'REDIS_PORT',
	'REDIS_PASSWORD',
	'CLICKUP_TOKEN',
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
	'GOOGLE_CLIENT_REDIRECT_URL'
];

export const env = {
	PUBLIC_URL: process.env?.PUBLIC_URL,
	API_SECRET_KEY: process.env?.API_SECRET_KEY,
	API_PORT: process.env?.API_PORT ? Number.parseInt(process.env.API_PORT) : 3000,
	REDIS_HOST: process.env?.REDIS_HOST ?? '127.0.0.1',
	REDIS_PORT: process.env?.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT) : 6379,
	REDIS_PASSWORD: process.env?.REDIS_PASSWORD,
	GOOGLE_CLIENT_ID: process.env?.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env?.GOOGLE_CLIENT_SECRET,
	GOOGLE_CLIENT_REDIRECT_URL: process.env?.GOOGLE_CLIENT_REDIRECT_URL,
	CLICKUP_TOKEN: process.env?.CLICKUP_TOKEN
};

export function evaluateEnv() {
	// eslint-disable-next-line no-undef
	for (let i in requiredEnvKeys) {
		// eslint-disable-next-line no-undef
		const key = requiredEnvKeys[i];
		if (!process.env[key]) {
			if (['API_PORT', 'REDIS_HOST', 'REDIS_PORT'].indexOf(key) !== -1) {
				console.warn(
					`Environment variable ${key} is set to default ${env[key]}`
				);
			} else {
				throw new Error(`Required environment variable ${key} is not set.`);
			}
		}
	}
}

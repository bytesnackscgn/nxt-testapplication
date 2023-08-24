import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envPath;

if (process.env.NODE_ENV === 'production') {
	envPath = '../../.env.production';
} else if (process.env.NODE_ENV === 'staging') {
	envPath = '../../.env.staging';
} else {
	envPath = '../../.env.development';
}

dotenv.config({ path: path.resolve(__dirname, envPath) });

export const requiredEnvKeys = [
	'REDIS_HOST',
	'REDIS_PORT',
	'REDIS_PASSWORD',
	'GOOGLE_API_KEY_FILE',
	'CLICKUP_TOKEN'
];

export const env = {
	PUBLIC_URL: process.env?.PUBLIC_URL,
	API_PORT: process.env?.API_PORT ? Number.parseInt(process.env.API_PORT) : 3000,
	REDIS_HOST: process.env?.REDIS_HOST ?? '127.0.0.1',
	REDIS_PORT: process.env?.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT) : 6379,
	REDIS_PASSWORD: process.env?.REDIS_PASSWORD,
	//GOOGLE_API_KEY_FILE: process.env.GOOGLE_API_KEY_FILE ? path.resolve( path.dirname(path.resolve(__dirname, envPath)), `${process.env.GOOGLE_API_KEY_FILE}`): null,
	GOOGLE_CLIENT_ID: process.env?.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env?.GOOGLE_CLIENT_SECRET,
	GOOGLE_CLIENT_REDIRECT_URL: process.env?.GOOGLE_CLIENT_REDIRECT_URL,
	CLICKUP_TOKEN: process.env?.CLICKUP_TOKEN
};

export function evaluateEnv() {
	// eslint-disable-next-line no-undef
	for (i in requiredEnvKeys) {
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

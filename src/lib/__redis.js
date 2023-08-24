/*
* Class is not neaded right now
*/
import { createClient } from 'redis';
import { config as redisConfig } from '../config/redis.js';

class Redis {
	client;
	ready = false;
	constructor() {
		this.client = createClient(redisConfig);

		this.client.on('error', (err) => {
			console.log('error', err);
		});

		this.client.on('connect', (err) => {
			this.ready = true;
		});

		this.client.on('ready', (err) => {
			this.ready = true;
		});
	}
}

export const redis = new Redis();

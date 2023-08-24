// producer queues running on the web server
import Queue from 'bee-queue';
import { createClient } from 'redis';
import { config as redisConfig } from '../config/redis.mjs';

const config = {
	isWorker: true,
	getEvents: true,
	sendEvents: true,
	storeJobs: true,
	ensureScripts: true,
	activateDelayedJobs: false,
	removeOnSuccess: true,
	removeOnFailure: false,
	redisScanCount: 20,
	redis: redisConfig//createClient(redisConfig),
};

export const chatMessageQueue = new Queue('CHAT_MESSAGE_DELIVERY', config);

chatMessageQueue.on('error', (error) => {
	//console.error(`A queue error happened: ${error.message}`);
});

chatMessageQueue.on('succeeded', (job, result) => {
	console.log(`Job ${job.id} succeeded with result: ${result}`);
});

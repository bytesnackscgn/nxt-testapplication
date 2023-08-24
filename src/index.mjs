import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import cors from '@koa/cors';
import session from 'koa-session';
import { google } from 'googleapis';
import { chatMessageQueue } from './lib/queue.mjs';
import { GChat } from './lib/chat.mjs';
import { ClickUp } from './lib/clickup.mjs';
import { env, evaluateEnv } from './config/env.mjs';
import { convertUnixTimestampToEuropeanTime } from './lib/time.mjs'
evaluateEnv();

const app = new Koa();
const router = new Router();

// Middleware
app.use(session(app));
app.use(bodyParser());
app.use(cors());

app.keys = [ env.API_SECRET_KEY ]; 
app.context.chat = null;
app.context.oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CLIENT_REDIRECT_URL);
app.context.clickup = new ClickUp();
await app.context.clickup.getMySpace();

app.context.chatMessageQueue = chatMessageQueue;

router.get('/', async (ctx) => {
	ctx.status = 200;
	ctx.body = { message: 'Welcome to the nxt-testapplication.' };
});

router.get('/ping', async (ctx) => {
	ctx.status = 200;
	ctx.body = { message: 'pong' };
});

// Redirect to Google OAuth consent screen
router.get('/auth', async (ctx) => {
	const authUrl = ctx.oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/chat.spaces',
			'https://www.googleapis.com/auth/chat.spaces.create',
			'https://www.googleapis.com/auth/chat.memberships',
			'https://www.googleapis.com/auth/chat.messages'
		],
	});
	ctx.redirect(authUrl);
});

// Handle OAuth callback
router.get('/oauth2callback', async (ctx) => {
	const { code } = ctx.query;
	const { tokens } = await ctx.oauth2Client.getToken(code);
	await ctx.oauth2Client.setCredentials(tokens);

	// Save tokens to session
	ctx.session.tokens = tokens;

	// Redirect to a setup-client route
	ctx.redirect('/setup-client');
});

router.get('/setup-client', async (ctx) => {
	if (!ctx.session.tokens) {
		ctx.redirect('/auth');
		return;
	}
	await ctx.clickup.createCustomWebHooks();
	ctx.oauth2Client.setCredentials(ctx.session.tokens);

	//set global chat api and use the authenticated client
	ctx.chat = new GChat(google.chat({ version: 'v1', auth: ctx.oauth2Client }));


	ctx.chatMessageQueue.process(async (job, done) => {
		//console.log(`processing`, job);
		let processData = [];
		let jobData = job.data;
		if(job.data.event === 'taskCreated'){
			const currentTimestamp = new Date().toISOString(); 
			const task = await ctx.clickup.getTask(job.data.task_id);

			console.log('THE TASK',await task);
			const newSpace = await ctx.chat.createSpace({
				requestId: task.id,
				displayName: `${task.name}-${currentTimestamp}`,
				description: `${task.description}`
			});
			const newMember = await ctx.chat.addMember(newSpace.name, 'gcp@bytesnacks.de');
			console.info(`New space has been created`, newSpace, newMember);
			processData.push(newSpace);
		}else if(job.event === 'taskCommentPosted'){
			const messageDate = convertUnixTimestampToEuropeanTime(job.data.history_items[0].date);
			const message = `${job.data.history_items[0].user} has commented on ${messageDate}`;
			const newMessage = await ctx.chat.createMessage(job.data.task_id ,message);
			processData.push(newMessage);
			console.info(`Tried to create new message`, newMessage);
		}
		done(`${job.task_id}`);
	});

	ctx.code = 200;
	ctx.body = {
		message: 'Client is setup and the Chatbot is connected to youre account.',
	};
});

router.post('/clickup/webhook', async (ctx) => {
	const data = ctx.request.body;
	
	const job = await ctx.chatMessageQueue.createJob(data);
	job.retries(2).save();

	console.info(`Clickup Webhook was triggered. Event: ${data.event} - TaskId: ${data.task_id}`)
	ctx.status = 200;
	ctx.body = {
		message: 'Message is pushed to queue.',
	};
});

router.get('/clickup/remove-customwebhooks', async (ctx) => {
	await ctx.clickup.getMySpace()
	let res = await ctx.clickup.removeAllWebhooks();
	ctx.status = 200;
	ctx.body = {
		...res
	};
});

router.get('/clickup/create-customwebhooks', async (ctx) => {
	await ctx.clickup.getMySpace();
	let res = await ctx.clickup.createCustomWebHooks();
	ctx.status = 200;
	ctx.body = {
		...res
	};
});

router.get('/clickup/status', async (ctx) => {
	const mySpace = await ctx.clickup.getMySpace()

	ctx.status = 200;
	ctx.body = {
		...mySpace
	};
});

router.get('/queue/status', async (ctx) => {
	const totalJobs = await ctx.chatMessageQueue.checkHealth();

	ctx.status = 200;
	ctx.body = {
		...totalJobs
	};
});


app.use(router.routes());
app.use(router.allowedMethods());

app.listen(env.API_PORT, () => {
	console.log(`Server is running on port ${env.API_PORT}`);
});

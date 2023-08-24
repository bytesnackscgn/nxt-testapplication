import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import cors from '@koa/cors';
import session from 'koa-session';
import { google } from 'googleapis';
import { chatMessageQueue } from './lib/queue.js';
import { GChat } from './lib/chat.js';
import { ClickUp } from './lib/clickup.js';
import { env, evaluateEnv } from './config/env.js';

evaluateEnv();

const app = new Koa();
const router = new Router();

// Middleware
app.use(session(app));
app.use(bodyParser());
app.use(cors());

app.context.chat = null;
app.context.oauth2Client = new google.auth.OAuth2(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	env.GOOGLE_CLIENT_REDIRECT_URL
);
app.context.clickup = new ClickUp();
app.context.clickup.getMySpace();
app.context.clickup.createCustomWebHooks();
app.context.chatMessageQueue = chatMessageQueue;

router.get('/ping', async (ctx) => {
	ctx.status = 200;
	ctx.body = { message: 'pong' };
});

// Redirect to Google OAuth consent screen
router.get('/auth', async (ctx) => {
	const authUrl = ctx.oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/chat.bot'],
	});
	ctx.redirect(authUrl);
});

// Handle OAuth callback
router.get('/oauth2callback', async (ctx) => {
	const { code } = ctx.query;
	const { tokens } = await ctx.oauth2Client.getToken(code);
	ctx.oauth2Client.setCredentials(tokens);

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

	ctx.oauth2Client.setCredentials(ctx.session.tokens);

	//set global chat api and use the authenticated client
	ctx.chat = new GChat(google.chat({ version: 'v1', auth: ctx.oauth2Client }));

	ctx.chatMessageQueue.process(async (job, done) => {
		if(job.event === 'taskCreated'){
			const currentTimestamp = new Date().toISOString(); 
			const task = ctx.clickup.getTask(job.task_id);
			const newSpace = ctx.chat.createSpace({
				requestId: task.id,
				displayName: `${task.name}-${currentTimestamp}`,
				description: `${task.description}`
			});
		}else if(job.event === 'taskCommentPosted'){
			const messageDate = convertUnixTimestampToEuropeanTime(job.history_items[0].date);
			const message = `${job.history_items[0].user} has commented on ${messageDate}`;
			const newMessage = await ctx.chat.createMessage(job.task_id ,message);
		}

		await ctx.chat.processItem(job);
		done();
	});

	ctx.code = 200;
	ctx.body = {
		message: 'Client is setup and the Chatbot is connected to youre account.',
	};
});

router.post('/clickup-webhook', async (ctx) => {
	const data = ctx.request.body;
	
	const job = await ctx.chatMessageQueue.createJob(data);
	job.retries(2).save();

	ctx.status = 200;
	ctx.body = {
		message: 'Message is pushed to queue.',
	};
});

router.get('/queue-status', async (ctx) => {
	const totalJobs = await ctx.chatMessageQueue.checkHealth();

	ctx.status = 200;
	ctx.body = {
		total_jobs: totalJobs,
	};
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(env.API_PORT, () => {
	console.log(`Server is running on port ${env.API_PORT}`);
});

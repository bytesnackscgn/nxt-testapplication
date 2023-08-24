/*
import { auth } from 'google-auth-library';
import { google } from 'googleapis';
import chat from '@googleapis/chat'
import { env } from '../config/env.js';
*/

export class GChat {
	api;

	constructor(api) {
		this.api = api;
	}

	/*
	async init() {
	  try{
		  const auth = new chat.auth.GoogleAuth({
			  email: 'nxt-chat@nxt-396819.iam.gserviceaccount.com',
			  delegationEmail: 'gcp@bytesnacks.de',
			  keyFile: env.GOOGLE_API_KEY_FILE,
			  scopes: [
				  'https://www.googleapis.com/auth/chat.bot',
				  'https://www.googleapis.com/auth/chat.spaces',
				  'https://www.googleapis.com/auth/chat.spaces.create',
				  'https://www.googleapis.com/auth/chat.memberships',
				  'https://www.googleapis.com/auth/chat.messages'
			  ],
			});
			
			const authClient = await auth.getClient();
  
			this.api = await chat.chat({ version: 'v1', auth: authClient });
			return true;
	  }catch(error){
		  console.log(error.message);
		  return false;
	  }
	}*/

	async getSpaces() {
		try {
			const response = await this.api.spaces.list();
			const spaces = response.data.spaces || [];
			return spaces;
		} catch (error) {
			console.error('Error retrieving spaces:', error.message);
			return false;
		}
	}

	async getSpace(spaceId) {
		try {
			const response = await this.api.spaces.get({
				name: `spaces/${spaceId}`,
			});
			const space = response.data;
			return space;
		} catch (error) {
			console.error('Error retrieving space:', error.message);
			return false;
		}
	}

	async getMembers(spaceId) {
		try {
			const response = await this.api.spaces.members.list({
				parent: `spaces/${spaceId}`,
			});
			const members = response.data.members || [];
			return members;
		} catch (error) {
			console.error('Error retrieving members:', error.message);
			return false;
		}
	}

	async addMember(spaceId, email) {
		try {
			const response = await this.api.spaces.members.create({
				parent: spaceId,
				requestBody: {
					email,
				},
			});
			return response.data;
		} catch (error) {
			console.error('Error adding member:', error.message);
			return false;
		}
	}

	async createSpace(data) {
		try {
			const response = await this.api.spaces.create({
				requestBody: {
					requestId: `${data.requestId}`,
					displayName: `${data.displayName}`,
					externalUserAllowed: false,
					singleUserBotDm: false,
					spaceDetails: {
						description: `${data.description}`,
					},
					//'spaceHistoryState': 'HISTORY_ON',
					spaceType: 'SPACE',
				},
			});

			return response.data;
		} catch (error) {
			console.error('Error creating space:', error.message);
			return false;
		}
	}

	async createMessage(spaceId,message) {
		try {
			const response = await this.api.spaces.messages.create({
				parent: `spaces/${spaceId}`,
				requestBody: {
					text: `${message}`
				},
			});

			return response.data;
		} catch (error) {
			console.error('Error creating message:', error.message);
			return false;
		}
	}

	/*
	doc: [
		"https://clickup.com/api/developer-portal/webhooktaskpayloads/#taskcreated-payload",
		"https://clickup.com/api/developer-portal/webhooktaskpayloads/#taskcommentposted-payload",
	]
	*/

	async processComment(spaceId, payload) {}
}

/*
  const gchat = new GChat();
  console.log(await gchat.init());
  console.log(await gchat.getSpaces());
  console.log(await gchat.createSpace({
	  displayName: 'TEST',
	  description: 'Testdescription'
  }));
  */

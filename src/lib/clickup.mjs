import axios from 'axios';
import { env } from '../config/env.mjs';

export class ClickUp {
	client;
	mySpace;
	constructor() {
		this.client = axios.create({
			baseURL: 'https://api.clickup.com/api/v2',
			headers: {
				Authorization: env.CLICKUP_TOKEN,
				'Content-Type': 'application/json',
			},
		});
	}

	async me() {
		const {
			data: { user },
		} = await this.client.get('/user');
		return user;
	}

	async newTask(listId, task) {
		try {
			const { data } = await this.client.post(`/list/${listId}/task`, task);
			return data;
		} catch (error) {
			console.error(error.message);
		}
	}


	async getTask(taskId){
		try {
			const { data } = await this.client.get(`/task/${taskId}`);
			return data;
		} catch (error) {
			console.error(error.message);
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/GetAuthorizedTeams/
	*/
	async getTeams() {
		try {
			const { data } = await this.client.get('/team');
			return data;
		} catch (error) {
			console.error(error.message);
			return [];
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/GetSpaces/
	*/
	async getSpaces(team_id) {
		try {
			const { data } = await this.client.get(`/team/${team_id}/space?archived=false`);
			return data;
		} catch (error) {
			console.error(error.message);
			return [];
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/GetFolders/
	*/
	async getFolders(space_id) {
		try {
			const { data } = await this.client.get(
				`/space/${space_id}/folder?archived=false`
			);
			return data;
		} catch (error) {
			console.error(error.message);
			return [];
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/GetWebhooks/
	*/
	async getWebhooks(team_id) {
		try {
			const { data } = await this.client.get(`/team/${team_id}/webhook`);
			return data;
		} catch (error) {
			console.error(error.message);
			return [];
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/DeleteWebhook/
	*/
	async deleteWebhooks(webhookId){
		try {
			const { data } = await this.client.delete(`/webhook/${webhookId}`);
			return data;
		} catch (error) {
			console.error(error.message);
			return false;
		}
	}

	async removeAllWebhooks(){
		try {
			for (let i = 0; i < this.mySpace.length; i++) {
				for (let j = 0; j < this.mySpace[i].webhooks.length; j++) {
					const res = await this.deleteWebhooks(this.mySpace[i].webhooks[j].id);
				}
			}
			this.mySpace = await this.getMySpace();
			return await this.mySpace;
		}catch(error){
			console.error(error);
			return false;
		}
	}

	/*
	doc: https://clickup.com/api/clickupreference/operation/CreateWebhook/
	*/
	async newWebhook(teamId, payload) {
		try {
			const { data } = await this.client.post(`/team/${teamId}/webhook`, payload);
			return data;
		} catch (error) {
			console.error(error.message);
		}
	}

	doesCustomWebhookExist(listId) {
		for (let i = 0; i < this.mySpace.length; i++) {
			let bool = this.mySpace[i].webhooks.findIndex(
				(el) =>
					el.list_id === listId &&
					el.events.indexOf('taskCreated') !== -1 &&
					el.events.indexOf('taskCommentPosted') !== -1
			);
			if (bool === true) return true;
		}
		return false;
	}

	async getMySpace() {
		const { teams } = await this.getTeams();
		for (let i = 0; i < (await teams.length); i++) {
			const { webhooks } = await this.getWebhooks(teams[i].id);
			const { spaces } = await this.getSpaces(teams[i].id);
			teams[i]['webhooks'] = webhooks;
			teams[i]['spaces'] = spaces;
			for (let j = 0; j < spaces.length; j++) {
				const { folders } = await this.getFolders(spaces[j].id);
				teams[i]['spaces'][j]['folders'] = folders;
			}
		}
		this.mySpace = teams;
		return this.mySpace;
	}

	async createCustomWebHooks() {
		for (let i = 0; i < this.mySpace.length; i++) {
			for (let j = 0; j < this.mySpace[i].spaces.length; j++) {
				for (let k = 0; k < this.mySpace[i].spaces[j].folders.length; k++) {
					for (let l = 0; l < this.mySpace[i].spaces[j].folders[k].lists.length; l++ ) {
						const currentList = this.mySpace[i].spaces[j].folders[k].lists[l];
						if (!this.doesCustomWebhookExist(currentList.id)) {
							try{
								const newWebhook = await this.newWebhook(this.mySpace[i].id, {
									endpoint: `${env.PUBLIC_URL}/clickup/webhook`,
									events: [
										'taskCreated',
										'taskCommentPosted',
									],
									list_id: Number.parseInt(currentList.id),
								});
							}catch(error){
								console.error('Could not create new webhooks: ', error.message);
							}
						}
					}
				}
			}
		}
		this.mySpace = await this.getMySpace();
		return this.mySpace
	}
}

export async function demo() {
	const clickup = new ClickUp();
	let mySpace = await clickup.getMySpace();
	console.log(mySpace[0].webhooks);
	await clickup.createCustomWebHooks();
	console.log(mySpace[0].webhooks);
	//await clickup.removeAllWebhooks();
	//console.log(mySpace[0].webhooks);
}

export class GChat {
	api;

	constructor(api) {
		this.api = api;
	}

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
				requestId: `${data.requestId}`,
				requestBody: {
					displayName: `${data.displayName}`,
					externalUserAllowed: false,
					singleUserBotDm: false,
					name: `spaces/${data.requestId}`,
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
}
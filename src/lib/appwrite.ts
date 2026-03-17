import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69b373670029695dae96');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    DB_ID: '69b3778a0006292b8708',
    USERS_COLLECTION: 'users',
    VIDEOS_COLLECTION: 'videos',
};

export default client;

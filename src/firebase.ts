import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { environment } from './environments/environment';

const app = initializeApp(environment.firebaseConfig);

export const db = getFirestore(app, 'profiles');

export const auth = getAuth(app);
export const storage = getStorage(app);
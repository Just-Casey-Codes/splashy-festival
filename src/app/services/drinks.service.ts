import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface UserDrinkEntry {
  uid?: string;
  profileName: string;
  avatarUrl?: string;
  drinkCount: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DrinksService {
  private firestore = inject(Firestore);

  getLeaderboard(): Observable<UserDrinkEntry[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, orderBy('drinkCount', 'desc'));
    return collectionData(q, { idField: 'uid' }) as Observable<UserDrinkEntry[]>;
  }

  getTotalDrinks(): Observable<number> {
    return this.getLeaderboard().pipe(
      map((users) => users.reduce((sum, u) => sum + (u.drinkCount || 0), 0))
    );
  }

  async addDrink(uid: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userRef, { drinkCount: increment(1) });
  }
}

import { Injectable } from '@angular/core';
import { db } from '../../firebase';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserDrinkEntry {
  uid?: string;
  profileName: string;
  avatarUrl?: string;
  drinkCount: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DrinksService {

  getLeaderboard(): Observable<UserDrinkEntry[]> {
    return new Observable((subscriber) => {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(
        usersRef,
        (snap) => {
          const users = snap.docs
            .map((d) => ({
              uid: d.id,
              ...(d.data() as Omit<UserDrinkEntry, 'uid'>),
            }))
            .sort((a, b) => (b.drinkCount || 0) - (a.drinkCount || 0));
          subscriber.next(users);
        },
        (err) => subscriber.error(err)
      );
      return { unsubscribe };
    });
  }

  getTotalDrinks(): Observable<number> {
    return this.getLeaderboard().pipe(
      map((users) => users.reduce((sum, u) => sum + (u.drinkCount || 0), 0))
    );
  }

  async addDrink(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { drinkCount: increment(1) });
  }
}
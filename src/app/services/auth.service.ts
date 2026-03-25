import { Injectable, NgZone } from '@angular/core';
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public user$: Observable<User | null>;

  constructor(private ngZone: NgZone) {
    this.user$ = new Observable((subscriber) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        this.ngZone.run(() => subscriber.next(user));
      });
      return { unsubscribe };
    });
  }

  loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider).then(() => {
    });
  }

  logout(): Promise<void> {
    return signOut(auth);
  }
}
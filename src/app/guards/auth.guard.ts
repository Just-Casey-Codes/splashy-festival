import { CanActivateFn, Router } from '@angular/router';
import { auth } from '../../firebase';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (): Observable<boolean> | Promise<boolean> | boolean => {
  const router = new Router();

  return new Promise<boolean>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/']);
        resolve(false);
      }
    });
  });
};
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../services/profile.model';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-profile.component.html',
  styleUrls: ['./select-profile.component.css'],
})
export class SelectProfileComponent implements OnInit {
  profiles: Profile[] = [];
  isLoading = true;
  isClaiming = false;
  errorMessage = '';

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      try {
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            this.router.navigate(['/home']);
            return;
          }
        }

        this.profiles = await this.profileService.getAvailableProfiles();
        this.isLoading = false;
        this.cdr.detectChanges();
      } catch (err: any) {
        console.error('[SelectProfile] Error:', err);
        this.errorMessage = 'Could not load profiles. Please refresh the page.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async selectProfile(profile: Profile): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in!');
      return;
    }

    this.isClaiming = true;
    this.cdr.detectChanges();

    try {
      const profileRef = doc(db, 'profiles', profile.id!);
      await updateDoc(profileRef, { claimedBy: user.uid });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        profileName: profile.name,
        avatarUrl: profile.url ?? '',
        drinkCount: 0,
        claimedAt: new Date(),
      });

      this.router.navigate(['/home']);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
      this.isClaiming = false;
      this.cdr.detectChanges();
    }
  }
}
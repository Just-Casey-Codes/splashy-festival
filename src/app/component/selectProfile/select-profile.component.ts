import { Component, OnInit, inject } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../services/profile.model';
import { Firestore, doc, setDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
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

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  constructor(private profileService: ProfileService) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (user) {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        this.router.navigate(['/home']);
        return;
      }
    }
    this.profiles = await this.profileService.getAvailableProfiles();
    this.isLoading = false;
  }

  async selectProfile(profile: Profile): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      alert('You must be logged in!');
      return;
    }
    this.isClaiming = true;
    try {
      const profileRef = doc(this.firestore, `profiles/${profile.id}`);
      await updateDoc(profileRef, { claimedBy: user.uid });

      const userRef = doc(this.firestore, `users/${user.uid}`);
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
    }
  }
}
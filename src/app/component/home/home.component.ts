import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DrinksService } from '../../services/drinks.service';
import { Subscription } from 'rxjs';

export const STATUS_OPTIONS = [
  { label: 'Chilling',  emoji: '😌' },
  { label: 'Feral',     emoji: '🤪' },
  { label: 'Dancing',   emoji: '💃' },
  { label: 'Eating',    emoji: '🍕' },
  { label: 'LOST',      emoji: '🗺️' },
  { label: 'Napping',   emoji: '😴' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private drinksService = inject(DrinksService);

  userProfile: { profileName: string; avatarUrl: string; status?: string } | null = null;
  totalDrinks = 0;
  isLoading = true;
  statusOptions = STATUS_OPTIONS;
  isUpdatingStatus = false;
  private drinksSub?: Subscription;

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.router.navigate(['/']); return; }

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      this.userProfile = userSnap.data() as { profileName: string; avatarUrl: string; status?: string };
    } else {
      this.router.navigate(['/select-profile']);
      return;
    }
    this.drinksSub = this.drinksService.getTotalDrinks().subscribe((total) => {
      this.totalDrinks = total;
    });
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.drinksSub?.unsubscribe();
  }

  async setStatus(option: { label: string; emoji: string }): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || this.isUpdatingStatus) return;
    this.isUpdatingStatus = true;
    const status = `${option.emoji} ${option.label}`;
    try {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await updateDoc(userRef, { status });
      if (this.userProfile) this.userProfile.status = status;
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  goTo(page: string): void {
    this.router.navigate([`/${page}`]);
  }

  async logout(): Promise<void> {
    const { getAuth, signOut } = await import('@angular/fire/auth');
    await signOut(getAuth());
    this.router.navigate(['/']);
  }
}

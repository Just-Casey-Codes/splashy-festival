import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { auth } from '../../../firebase';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DrinksService, UserDrinkEntry } from '../../services/drinks.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-drinking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drinking.component.html',
  styleUrls: ['./drinking.component.css'],
})
export class DrinkingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private drinksService = inject(DrinksService);
  private cdr = inject(ChangeDetectorRef);

  totalDrinks = 0;
  leaderboard: UserDrinkEntry[] = [];
  myDrinkCount = 0;
  isAdding = false;
  uid = '';

  private subs: Subscription[] = [];

  ngOnInit(): void {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (!user) { this.router.navigate(['/']); return; }
      this.uid = user.uid;

      this.subs.push(
        this.drinksService.getLeaderboard().subscribe({
          next: (lb) => {
            this.leaderboard = lb;
            this.totalDrinks = lb.reduce((s, u) => s + (u.drinkCount || 0), 0);
            const me = lb.find((u) => u['uid'] === this.uid);
            this.myDrinkCount = me?.drinkCount ?? 0;
            this.cdr.detectChanges();
          },
          error: (err) => { console.error('[Drinks] Leaderboard error:', err); }
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  async addDrink(): Promise<void> {
    if (!this.uid || this.isAdding) return;
    this.isAdding = true;
    try {
      await this.drinksService.addDrink(this.uid);
    } finally {
      this.isAdding = false;
      this.cdr.detectChanges();
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  medal(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }
}

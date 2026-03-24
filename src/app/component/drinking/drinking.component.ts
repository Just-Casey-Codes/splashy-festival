import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private drinksService = inject(DrinksService);

  totalDrinks = 0;
  leaderboard: UserDrinkEntry[] = [];
  myDrinkCount = 0;
  isAdding = false;
  uid = '';

  private subs: Subscription[] = [];

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.router.navigate(['/']); return; }
    this.uid = user.uid;

    this.subs.push(
      this.drinksService.getLeaderboard().subscribe((lb) => {
        this.leaderboard = lb;
        this.totalDrinks = lb.reduce((s, u) => s + (u.drinkCount || 0), 0);
        const me = lb.find((u) => u['uid'] === this.uid);
        this.myDrinkCount = me?.drinkCount ?? 0;
      })
    );
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

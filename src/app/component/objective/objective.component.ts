import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { ObjectiveService, ObjectiveLeaderEntry } from '../../services/objective.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-objective',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './objective.component.html',
  styleUrls: ['./objective.component.css'],
})
export class ObjectiveComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  todayObjective = '';
  todayDate = '';
  hasCompletedToday = false;
  isCompleting = false;
  isRefreshing = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  leaderboard: ObjectiveLeaderEntry[] = [];
  errorMessage = '';

  private uid = '';
  private profileName = '';
  private avatarUrl = '';
  private refreshCount = 0;
  private lbSub?: Subscription;

  constructor(private objectiveService: ObjectiveService) {}

  ngOnInit(): void {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      try {
        if (!user) { this.router.navigate(['/']); return; }
        this.uid = user.uid;

        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          this.profileName = data.profileName ?? '';
          this.avatarUrl = data.avatarUrl ?? '';
          this.refreshCount = data.objectiveRefreshCount ?? 0;
          this.hasCompletedToday = (data.lastObjectiveDate ?? '') === this.objectiveService.todayKey();
        }

        const now = new Date();
        this.todayDate = now.toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long',
        });

        this.todayObjective = await this.objectiveService.getTodayObjective(user.uid, this.refreshCount);

        this.lbSub = this.objectiveService.getLeaderboard().subscribe({
          next: (lb) => { this.leaderboard = lb; this.cdr.detectChanges(); },
          error: (err) => { console.error('[Objective] leaderboard error', err); }
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      } catch (err) {
        console.error('[Objective] error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void { this.lbSub?.unsubscribe(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => { this.previewUrl = e.target?.result as string; this.cdr.detectChanges(); };
    reader.readAsDataURL(this.selectedFile);
  }

  cancelProof(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.cdr.detectChanges();
  }

  async submitComplete(): Promise<void> {
    if (!this.selectedFile || this.isCompleting) return;
    this.isCompleting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    try {
      await this.objectiveService.completeObjective(
        this.uid, this.profileName, this.avatarUrl, this.todayObjective, this.selectedFile
      );
      this.hasCompletedToday = true;
      this.selectedFile = null;
      this.previewUrl = null;
    } catch (err: any) {
      console.error('[Objective] complete error:', err);
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.isCompleting = false;
      this.cdr.detectChanges();
    }
  }

  async getNewObjective(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.cdr.detectChanges();
    try {
      const result = await this.objectiveService.getNewObjective(this.uid, this.refreshCount);
      this.refreshCount = result.refreshCount;
      this.todayObjective = result.objective;
      this.hasCompletedToday = false;
      this.selectedFile = null;
      this.previewUrl = null;
    } catch (err) {
      console.error('[Objective] refresh error:', err);
    } finally {
      this.isRefreshing = false;
      this.cdr.detectChanges();
    }
  }

  medal(i: number): string {
    return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
  }

  goHome(): void { this.router.navigate(['/home']); }
}
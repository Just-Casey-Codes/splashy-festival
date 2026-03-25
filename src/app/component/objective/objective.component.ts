import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ObjectiveService } from '../../services/objective.service';
import { auth } from '../../../firebase';

@Component({
  selector: 'app-objective',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './objective.component.html',
  styleUrls: ['./objective.component.css'],
})
export class ObjectiveComponent implements OnInit {
  todayObjective = '';
  isLoading = true;
  todayDate = '';

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(private objectiveService: ObjectiveService) {}

  ngOnInit(): void {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      try {
        if (!user) { this.router.navigate(['/']); return; }

        const now = new Date();
        this.todayDate = now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        this.todayObjective = await this.objectiveService.getTodayObjective();
        this.isLoading = false;
        this.cdr.detectChanges();
      } catch (err) {
        console.error('[Objective] Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
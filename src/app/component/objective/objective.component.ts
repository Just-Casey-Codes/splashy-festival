import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ObjectiveService } from '../../services/objective.service';

@Component({
  selector: 'app-objective',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './objective.component.html',
  styleUrls: ['./objective.component.css'],
})
export class ObjectiveComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private objectiveService = inject(ObjectiveService);

  todayObjective = '';
  isLoading = true;
  todayDate = '';

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.router.navigate(['/']); return; }

    const now = new Date();
    this.todayDate = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    this.todayObjective = await this.objectiveService.getTodayObjective();
    this.isLoading = false;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}

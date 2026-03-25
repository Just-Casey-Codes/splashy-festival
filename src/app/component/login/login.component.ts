import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  isLoading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Auth subscription error:', err);
      },
    });
  }

  async login() {
    this.isLoading = true;
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/select-profile']);
    } catch (err) {
      console.error('Login failed:', err);
      if (err instanceof Error) {
        alert('Login failed: ' + err.message);
      } else {
        alert('Login failed: ' + JSON.stringify(err));
      }
    } finally {
      this.isLoading = false;
    }
  }
}
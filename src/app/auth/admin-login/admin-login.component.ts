import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent implements OnInit {
  // Toggle between login and register
  isLoginMode: boolean = true;

  // Login fields
  adminNumber: string = '';
  password: string = '';

  // Register fields
  registerUsername: string = '';
  fullName: string = '';
  registerPassword: string = '';
  confirmPassword: string = '';

  currentDateTime: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateDateTime();
    setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    this.currentDateTime = `${dayName}, ${monthName} ${day}, ${year} : ${hours}:${minutes}`;
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.clearFields();
    this.errorMessage = '';
    this.successMessage = '';
  }

  clearFields() {
    this.adminNumber = '';
    this.password = '';
    this.registerUsername = '';
    this.fullName = '';
    this.registerPassword = '';
    this.confirmPassword = '';
  }

  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.adminNumber || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    
    // Backend authentication
    this.authService.adminLogin(this.adminNumber, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status.remarks === 'success') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMessage = response.status.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Login error:', error);
      }
    });
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.registerUsername || !this.fullName || !this.registerPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
    if (this.registerPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }
    if (this.registerPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters';
      return;
    }

    this.isLoading = true;

    // Backend registration
    const adminData = {
      username: this.registerUsername,
      fullName: this.fullName,
      password: this.registerPassword
    };
    
    this.authService.adminRegister(adminData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status.remarks === 'success') {
          this.successMessage = 'Registration successful! Please login.';
          setTimeout(() => {
            this.toggleMode();
            this.adminNumber = this.registerUsername;
          }, 2000);
        } else {
          this.errorMessage = response.status.message || 'Registration failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // Admin Information
  username: string = '';
  fullName: string = '';
  adminId: number = 0;
  
  // Edit mode toggles
  isChangingPassword: boolean = false;
  
  // Password form data
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // Success/Error messages
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getAdminUser();
    
    if (!currentUser || currentUser.userType !== 'admin') {
      this.router.navigate(['/admin-login']);
      return;
    }

    // Populate form with actual admin data from backend
    this.adminId = currentUser.id || currentUser.admin_id || 0;
    this.username = currentUser.username || '';
    this.fullName = currentUser.full_name || '';
  }
  
  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    if (this.isChangingPassword) {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.successMessage = '';
      this.errorMessage = '';
    }
  }
  
  cancelPasswordChange() {
    this.isChangingPassword = false;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
  
  changePassword() {
    // Validate current password
    if (!this.passwordForm.currentPassword) {
      this.errorMessage = 'Please enter your current password';
      alert('❌ Please enter your current password');
      return;
    }
    
    // Validate new password
    if (this.passwordForm.newPassword.length < 8) {
      this.errorMessage = 'New password must be at least 8 characters';
      alert('❌ New password must be at least 8 characters');
      return;
    }
    
    // Validate password match
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage = 'New passwords do not match';
      alert('❌ New passwords do not match');
      return;
    }
    
    // Call backend API
    const currentUser = this.authService.getAdminUser();
    if (!currentUser || (!currentUser.id && !currentUser.admin_id)) {
      this.errorMessage = 'User not authenticated';
      alert('❌ User not authenticated. Please login again.');
      this.router.navigate(['/admin-login']);
      return;
    }

    const adminId = currentUser.id || currentUser.admin_id;

    this.apiService.changeAdminPassword(
      adminId,
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).subscribe({
      next: (response: any) => {
        if (response.status.remarks === 'success') {
          this.isChangingPassword = false;
          this.successMessage = 'Password changed successfully!';
          this.errorMessage = '';
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          
          alert('✅ Password changed successfully!');
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.status.message || 'Failed to change password';
          alert('❌ ' + this.errorMessage);
        }
      },
      error: (error: any) => {
        console.error('Password change error:', error);
        const errorMsg = error.error?.status?.message || 'Error changing password';
        this.errorMessage = errorMsg;
        alert('❌ ' + errorMsg);
      }
    });
  }
  
  getInitials(): string {
    const names = this.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
    }
    return this.fullName.charAt(0) || 'A';
  }
}

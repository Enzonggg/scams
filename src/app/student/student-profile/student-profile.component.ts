import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
  // Student Information
  studentNumber: string = '';
  lastName: string = '';
  firstName: string = '';
  middleName: string = '';
  program: string = '';
  yearLevel: string = '';
  section: string = '';
  major: string = '';
  
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
    const currentUser = this.authService.getStudentUser();
    
    if (!currentUser || currentUser.userType !== 'student') {
      this.router.navigate(['/student-login']);
      return;
    }

    // Populate form with actual user data from backend
    this.studentNumber = currentUser.student_number || '';
    this.lastName = currentUser.last_name || '';
    this.firstName = currentUser.first_name || '';
    this.middleName = currentUser.middle_name || '';
    this.program = currentUser.program || '';
    this.yearLevel = currentUser.year_level?.toString() || '';
    this.section = currentUser.section || '';
    this.major = currentUser.major || '';
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
    const currentUser = this.authService.getStudentUser();
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not authenticated';
      alert('❌ User not authenticated. Please login again.');
      this.router.navigate(['/student-login']);
      return;
    }

    this.apiService.changeStudentPassword(
      currentUser.id,
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
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`;
  }
}

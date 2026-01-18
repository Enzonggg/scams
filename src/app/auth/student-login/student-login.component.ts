import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.css'
})
export class StudentLoginComponent implements OnInit {
  // Toggle between login and register
  isLoginMode: boolean = true;

  // Login fields
  studentNumber: string = '';
  password: string = '';

  // Register fields
  registerStudentNumber: string = '';
  lastName: string = '';
  firstName: string = '';
  middleName: string = '';
  program: string = '';
  yearLevel: string = '';
  section: string = '';
  major: string = '';
  registerPassword: string = '';
  confirmPassword: string = '';

  currentDateTime: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
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

  // Check if major field should be shown
  get showMajorField(): boolean {
    return this.yearLevel === '3' || this.yearLevel === '4';
  }

  // Toggle between login and register
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    // Clear fields when switching modes
    this.clearFields();
    this.errorMessage = '';
    this.successMessage = '';
  }

  clearFields() {
    this.studentNumber = '';
    this.password = '';
    this.registerStudentNumber = '';
    this.lastName = '';
    this.firstName = '';
    this.middleName = '';
    this.program = '';
    this.yearLevel = '';
    this.section = '';
    this.major = '';
    this.registerPassword = '';
    this.confirmPassword = '';
  }

  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.studentNumber || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    
    this.authService.studentLogin(this.studentNumber, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status.remarks === 'success') {
          this.router.navigate(['/student/dashboard']);
        } else {
          this.errorMessage = response.status.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Login failed. Please check your credentials.';
      }
    });
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.registerStudentNumber || !this.lastName || !this.firstName || 
        !this.program || !this.yearLevel || !this.section || !this.registerPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    if (this.registerPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }
    if (this.showMajorField && !this.major) {
      this.errorMessage = 'Please select a major for Year 3 and 4 students.';
      return;
    }

    this.isLoading = true;

    // Backend registration with semester and academic year
    const studentData = {
      studentNumber: this.registerStudentNumber,
      lastName: this.lastName,
      firstName: this.firstName,
      middleName: this.middleName,
      program: this.program,
      yearLevel: parseInt(this.yearLevel),
      section: this.section,
      major: this.major,
      semester: '1st Semester',
      academicYear: '2024-2025',
      password: this.registerPassword
    };

    
    this.authService.studentRegister(studentData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status.remarks === 'success') {
          this.successMessage = 'Registration successful! Please login.';
          setTimeout(() => {
            this.toggleMode();
            this.studentNumber = this.registerStudentNumber;
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

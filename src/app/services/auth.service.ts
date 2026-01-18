import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface ApiResponse {
  status: {
    remarks: string;
    message: string;
  };
  payload: any;
  prepared_by: string;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
   private apiUrl = 'http://localhost/clearance_management/clearance_api/api/';
    // private apiUrl = 'https://api.lspu-ccsclearance.online/clearance_api/api/';

  private router = inject(Router);

  constructor(private http: HttpClient) {
  }

  adminLogin(username: string, password: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}?request=admin-login`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (response.status.remarks === 'success') {
          const adminUser = { ...response.payload, userType: 'admin' };
          localStorage.setItem('adminUser', JSON.stringify(adminUser));
        }
      })
    );
  }

  studentLogin(studentNumber: string, password: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}?request=student-login`, {
      studentNumber,
      password
    }).pipe(
      tap(response => {
        if (response.status.remarks === 'success') {
          const studentUser = { ...response.payload, userType: 'student' };
          localStorage.setItem('studentUser', JSON.stringify(studentUser));
        }
      })
    );
  }
  

  studentRegister(studentData: {
    studentNumber: string;
    lastName: string;
    firstName: string;
    middleName: string;
    program: string;
    yearLevel: number;
    section: string;
    major: string;
    semester: string;
    academicYear: string;
    password: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}?request=student-register`, studentData);
  }

  adminRegister(adminData: {
    username: string;
    fullName: string;
    password: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}?request=admin-register`, adminData);
  }

  // Admin-specific methods
  getAdminUser(): any {
    const storedAdmin = localStorage.getItem('adminUser');
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  }

  isAdminAuthenticated(): boolean {
    return this.getAdminUser() !== null;
  }

  adminLogout(): void {
    localStorage.removeItem('adminUser');
  }

  // Student-specific methods
  getStudentUser(): any {
    const storedStudent = localStorage.getItem('studentUser');
    return storedStudent ? JSON.parse(storedStudent) : null;
  }

  isStudentAuthenticated(): boolean {
    return this.getStudentUser() !== null;
  }

  studentLogout(): void {
    localStorage.removeItem('studentUser');
  }

  // Legacy methods (kept for backward compatibility but deprecated)
  getCurrentUser(): any {
    const url = this.router.url;
    if (url.startsWith('/admin')) {
      return this.getAdminUser();
    } else if (url.startsWith('/student')) {
      return this.getStudentUser();
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  logout(): void {
    const url = this.router.url;
    if (url.startsWith('/admin')) {
      this.adminLogout();
    } else if (url.startsWith('/student')) {
      this.studentLogout();
    }
  }

  getUserType(): string | null {
    return this.getCurrentUser()?.userType || null;
  }
}

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const adminUser = authService.getAdminUser();
  
  if (adminUser && adminUser.userType === 'admin') {
    return true;
  }
  
  router.navigate(['/admin-login']);
  return false;
};

export const studentGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const studentUser = authService.getStudentUser();
  
  if (studentUser && studentUser.userType === 'student') {
    return true;
  }
  
  router.navigate(['/student-login']);
  return false;
};

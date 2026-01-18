import { Routes } from '@angular/router';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { StudentLoginComponent } from './auth/student-login/student-login.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { StudentComponent } from './admin/student/student.component';
import { StudentListComponent } from './admin/student-list/student-list.component';
import { ApprovedStudentsComponent } from './admin/approved-students/approved-students.component';
import { ProfileComponent } from './admin/profile/profile.component';
import { RequirementsManagementComponent } from './admin/requirements-management/requirements-management.component';
import { AboutComponent as AdminAboutComponent } from './admin/about/about.component';
import { StudentLayoutComponent } from './student/student-layout/student-layout.component';
import { StudentDashboardComponent } from './student/dashboard/dashboard.component';
import { StudentProfileComponent } from './student/student-profile/student-profile.component';
import { AboutComponent as StudentAboutComponent } from './student/about/about.component';
import { adminGuard, studentGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/student-login', pathMatch: 'full' },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'student-login', component: StudentLoginComponent },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'student-list', component: StudentListComponent },
      { path: 'students', component: StudentComponent },
      { path: 'approved-students', component: ApprovedStudentsComponent },
      { path: 'requirements', component: RequirementsManagementComponent },
      { path: 'about', component: AdminAboutComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [studentGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'profile', component: StudentProfileComponent },
      { path: 'about', component: StudentAboutComponent }
    ]
  },
  { path: '**', redirectTo: '/student-login' }
];

 
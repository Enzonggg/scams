import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class StudentNavbarComponent {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  onLogout() {
    // Clear authentication
    this.authService.studentLogout();
    // Navigate to student login
    this.router.navigate(['/student-login']);
  }
}

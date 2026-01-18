import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentDateTime: string = '';
  
  // Global filters
  selectedSemester: string = '1st Semester';
  selectedAcadYear: string = '2024-2025';
  
  semesters = ['1st Semester', '2nd Semester', 'Inter-Semester'];
  academicYears = ['2024-2025', '2025-2026', '2026-2027'];

  constructor(private apiService: ApiService) {}

  // Stats data (initialized empty, loaded from backend)
  stats = {
    totalStudents: 0,
    totalRequirements: 0,
    approvedStudents: 0,
    pendingStudents: 0
  };

  // Recent activities (initialized empty, loaded from backend)
  recentActivities: any[] = [];

  // Pie chart data (for visual representation)
  clearanceProgress = {
    approved: 0,
    pending: 0,
    total: 0
  };

  ngOnInit() {
    this.updateDateTime();
    this.loadDashboardData();
    setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  onFilterChange() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Load stats
    this.apiService.getDashboardStats(this.selectedSemester, this.selectedAcadYear).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          this.stats = response.payload;
          this.clearanceProgress.approved = response.payload.approvedStudents;
          this.clearanceProgress.pending = response.payload.pendingStudents;
          this.clearanceProgress.total = response.payload.totalStudents;
        }
      },
      error: (error) => console.error('Error loading stats:', error)
    });

    // Load recent activities
    this.apiService.getRecentActivities(4).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          this.recentActivities = response.payload.map((activity: any) => ({
            studentName: `${activity.first_name} ${activity.last_name}`,
            action: activity.description,
            timestamp: new Date(activity.created_at).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: activity.action_type
          }));
        }
      },
      error: (error) => console.error('Error loading activities:', error)
    });
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

  getClearedPercentage(): number {
    return Math.round((this.clearanceProgress.approved / this.clearanceProgress.total) * 100);
  }

  getPendingPercentage(): number {
    return Math.round((this.clearanceProgress.pending / this.clearanceProgress.total) * 100);
  }
}

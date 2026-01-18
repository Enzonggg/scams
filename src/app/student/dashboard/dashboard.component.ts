import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface Requirement {
  id: number;
  office: string;
  requirement: string;
  status: 'Completed' | 'Pending' | 'Missing';
  dateSubmitted?: string;
  remarks?: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit {
  // Global filters
  selectedSemester: string = '1st Semester';
  selectedAcadYear: string = '2024-2025';
  semesters = ['1st Semester', '2nd Semester', 'Inter-Semester'];
  academicYears = ['2024-2025', '2025-2026', '2026-2027'];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}
  
  studentName: string = '';
  studentNumber: string = '';
  program: string = '';
  yearLevel: string = '';
  semester: string = '';
  overallStatus: string = 'Pending';
  
  requirements: Requirement[] = [];

  ngOnInit() {
    this.loadStudentData();
  }

  loadStudentData() {
    const currentUser = this.authService.getStudentUser();
    
    if (!currentUser || currentUser.userType !== 'student') {
      return;
    }

    // Set student info from current user
    this.studentName = `${currentUser.first_name} ${currentUser.last_name}`;
    this.studentNumber = currentUser.student_number;
    this.program = currentUser.program;
    this.yearLevel = currentUser.year_level?.toString();
    this.semester = `${this.selectedSemester} ${this.selectedAcadYear}`;

    // Clear existing requirements before loading new ones
    this.requirements = [];

    // Load clearances from backend
    this.apiService.getClearancesByStudent(
      currentUser.id,
      this.selectedSemester,
      this.selectedAcadYear
    ).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success' && response.payload) {
          this.requirements = response.payload.map((clearance: any) => ({
            id: clearance.clearance_id,
            office: clearance.title,
            requirement: clearance.description,
            status: clearance.status === 'Approved' ? 'Completed' : 'Pending',
            dateSubmitted: clearance.approved_date,
            remarks: clearance.remarks || ''
          }));
          this.checkOverallStatus();
        } else {
          this.requirements = [];
          this.checkOverallStatus();
        }
      },
      error: (error) => {
        console.error('Error loading clearances:', error);
        this.requirements = [];
        this.checkOverallStatus();
      }
    });
  }

  checkOverallStatus() {
    // If no requirements, status should be Pending
    if (this.requirements.length === 0) {
      this.overallStatus = 'Pending';
      return;
    }
    
    const allCompleted = this.requirements.every(req => req.status === 'Completed');
    const hasMissing = this.requirements.some(req => req.status === 'Missing');
    
    if (allCompleted) {
      this.overallStatus = 'Approved';
    } else if (hasMissing) {
      this.overallStatus = 'Incomplete';
    } else {
      this.overallStatus = 'Pending';
    }
  }

  refreshRequirements() {
    this.loadStudentData();
  }

  onFilterChange() {
    this.loadStudentData();
  }

  downloadClearance() {
    // Get the uploaded template and download it
    this.apiService.getActiveTemplate().subscribe({
      next: (response) => {
        if (response.status.remarks === 'success' && response.payload) {
          const template = response.payload;
          // const filePath = `http://localhost/clearance_management/clearance_api/${template.file_path}`;
                    const filePath = `https://api.lspu-ccsclearance.online/clearance_api/${template.file_path}`;

          // Create a temporary anchor element to trigger download
          const link = document.createElement('a');
          link.href = filePath;
          link.download = template.file_name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert('No clearance template available. Please contact the admin.');
        }
      },
      error: (error) => {
        console.error('Template download error:', error);
        alert('Error downloading clearance template');
      }
    });
  }

  get completedCount(): number {
    return this.requirements.filter(req => req.status === 'Completed').length;
  }

  get pendingCount(): number {
    return this.requirements.filter(req => req.status === 'Pending').length;
  }

  get missingCount(): number {
    return this.requirements.filter(req => req.status === 'Missing').length;
  }

  get completionPercentage(): number {
    if (this.requirements.length === 0) {
      return 0;
    }
    return Math.round((this.completedCount / this.requirements.length) * 100);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Clearance {
  office: string;
  status: string;
  date: string;
  remarks: string;
}

interface ApprovedStudent {
  id: number;
  lastName: string;
  firstName: string;
  year: number;
  section: string;
  program: string;
  major: string;
  dateApproved: string;
  clearances: Clearance[];
}

@Component({
  selector: 'app-approved-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approved-students.component.html',
  styleUrl: './approved-students.component.css'
})
export class ApprovedStudentsComponent implements OnInit {
  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadApprovedStudents();
  }

  onFilterChange() {
    this.loadApprovedStudents();
  }

  loadApprovedStudents() {
    // Clear existing students before loading new ones
    this.approvedStudents = [];
    
    this.apiService.getApprovedStudents(this.selectedSemester, this.selectedAcadYear).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          this.approvedStudents = response.payload.map((student: any) => ({
            id: student.id,
            lastName: student.last_name,
            firstName: student.first_name,
            year: student.year_level,
            section: student.section,
            program: student.program,
            major: student.major,
            dateApproved: new Date(student.updated_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            clearances: student.clearances?.map((c: any) => ({
              office: c.title,
              status: c.status,
              date: new Date(c.approved_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              remarks: c.remarks || c.description
            })) || []
          }));
        } else {
          this.approvedStudents = [];
        }
      },
      error: (error) => {
        console.error('Error loading approved students:', error);
        this.approvedStudents = [];
      }
    });
  }
  // Global filters
  selectedSemester: string = '1st Semester';
  selectedAcadYear: string = '2024-2025';
  semesters = ['1st Semester', '2nd Semester', 'Inter-Semester'];
  academicYears = ['2024-2025', '2025-2026', '2026-2027'];
  
  searchTerm: string = '';
  filterYear: string = 'all';
  filterProgram: string = 'all';
  filterMajor: string = 'all';
  selectedStudent: ApprovedStudent | null = null;

  approvedStudents: ApprovedStudent[] = [];

  get filteredStudents(): ApprovedStudent[] {
    return this.approvedStudents.filter(student => {
      const matchesSearch = 
        student.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.firstName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesYear = this.filterYear === 'all' || student.year.toString() === this.filterYear;
      const matchesProgram = this.filterProgram === 'all' || student.program === this.filterProgram;
      const matchesMajor = this.filterMajor === 'all' || student.major === this.filterMajor;

      return matchesSearch && matchesYear && matchesProgram && matchesMajor;
    });
  }

  printClearance(student: ApprovedStudent): void {
    // Download the uploaded template file for this student
    this.apiService.getActiveTemplate().subscribe({
      next: (response) => {
        if (response.status.remarks === 'success' && response.payload) {
          const template = response.payload;
          const filePath = `https://api.lspu-ccsclearance.online/clearance_api/${template.file_path}`;
          
          // Open template in new window for printing
          window.open(filePath, '_blank');
        } else {
          alert('No clearance template available. Please upload a template first.');
        }
      },
      error: (error) => {
        console.error('Template error:', error);
        alert('Error loading clearance template');
      }
    });
  }

  printAll(): void {
    // Download the uploaded template file (same for all approved students)
    this.apiService.getActiveTemplate().subscribe({
      next: (response) => {
        if (response.status.remarks === 'success' && response.payload) {
          const template = response.payload;
          const filePath = `https://api.lspu-ccsclearance.online/clearance_api/${template.file_path}`;
          
          // Open template in new window for printing
          window.open(filePath, '_blank');
          
          alert('Note: The same template will be used for all approved students. You may need to fill in individual student details manually.');
        } else {
          alert('No clearance template available. Please upload a template first.');
        }
      },
      error: (error) => {
        console.error('Template error:', error);
        alert('Error loading clearance template');
      }
    });
  }
}

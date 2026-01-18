import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface Requirement {
  id: number;
  title: string;
  description: string;
  yearLevels: number[];
  datePosted: string;
  semester?: string;
  academic_year?: string;
  date_posted?: string;
}

@Component({
  selector: 'app-requirements-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requirements-management.component.html',
  styleUrl: './requirements-management.component.css'
})
export class RequirementsManagementComponent implements OnInit {
  // Global filters
  selectedSemester: string = '1st Semester';
  selectedAcadYear: string = '2024-2025';
  semesters = ['1st Semester', '2nd Semester', 'Inter-Semester'];
  academicYears = ['2024-2025', '2025-2026', '2026-2027'];
  
  // Requirements form
  newRequirement = {
    title: '',
    description: ''
  };

  // Template upload
  selectedFile: File | null = null;
  uploadedTemplate: string = '';

  // Requirements list
  requirements: Requirement[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadRequirements();
  }

  ngOnInit() {
    this.loadActiveTemplate();
  }

  // Load existing template
  loadActiveTemplate() {
    this.apiService.getActiveTemplate().subscribe({
      next: (response) => {
        if (response.status.remarks === 'success' && response.payload) {
          this.uploadedTemplate = response.payload.file_name;
        }
      },
      error: (error) => {
        console.log('No active template found or error loading template:', error);
        // It's OK if no template exists yet
      }
    });
  }

  // Load requirements from backend
  onFilterChange() {
    this.loadRequirements();
  }

  loadRequirements() {
    // Clear existing requirements before loading new ones
    this.requirements = [];
    
    this.apiService.getRequirements(this.selectedSemester, this.selectedAcadYear).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          this.requirements = response.payload.map((req: any) => ({
            id: req.id,
            title: req.title,
            description: req.description,
            yearLevels: [1, 2, 3, 4],
            datePosted: new Date(req.date_posted).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          }));
        } else {
          this.requirements = [];
        }
      },
      error: (error) => {
        console.error('Error loading requirements:', error);
        this.requirements = [];
      }
    });
  }
  
  // Add new requirement
  addRequirement() {
    if (this.newRequirement.title && this.newRequirement.description) {
      this.apiService.createRequirement({
        title: this.newRequirement.title,
        description: this.newRequirement.description,
        semester: this.selectedSemester,
        academicYear: this.selectedAcadYear
      }).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            alert(`Requirement created! ${response.payload.students_affected} student(s) affected.`);
            this.loadRequirements(); // Reload the list
            this.newRequirement = { title: '', description: '' };
          }
        },
        error: (error) => {
          console.error('Error creating requirement:', error);
          alert('Failed to create requirement');
        }
      });
    } else {
      alert('Please enter both title and description');
    }
  }

  // Get year levels as readable string
  getYearLevelsText(yearLevels: number[]): string {
    if (yearLevels.length === 4) return 'All Years';
    return yearLevels.map(y => `${y}${this.getOrdinalSuffix(y)} Year`).join(', ');
  }

  // Get ordinal suffix for year
  getOrdinalSuffix(year: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = year % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  }

  // Delete requirement
  deleteRequirement(id: number) {
    if (confirm('Are you sure you want to delete this requirement? This will also delete all associated clearances.')) {
      this.apiService.deleteRequirement(id).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            alert('Requirement deleted successfully');
            this.loadRequirements();
          }
        },
        error: (error) => {
          console.error('Error deleting requirement:', error);
          alert('Failed to delete requirement');
        }
      });
    }
  }

  // Handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Upload template
  uploadTemplate() {
    if (this.selectedFile) {
      // Real file upload to server
      this.apiService.uploadTemplateFile(this.selectedFile).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success' && response.payload) {
            this.uploadedTemplate = response.payload.file_name;
            alert('Template uploaded successfully! Students will see this template once approved.');
            this.selectedFile = null;
            
            // Reset file input
            const fileInput = document.getElementById('templateFile') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          } else {
            alert('Failed to upload template: ' + (response.status.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          alert('Error uploading template: ' + (error.error?.status?.message || error.message || 'Unknown error'));
        }
      });
    }
  }

  // Download template
}

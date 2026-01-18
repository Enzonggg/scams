import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface Student {
  id: number;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  year: number;
  section: string;
  program: string;
  major: string;
  semester?: string;
  academicYear?: string;
  status: 'Approved' | 'Pending';
  clearances: Clearance[];
  selected?: boolean;
}

interface Clearance {
  clearance_id?: number;
  office: string;
  status: 'Approved' | 'Pending';
  date?: string;
  remarks?: string;
  checked?: boolean;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    // Clear existing students before loading new ones
    this.students = [];
    
    this.apiService.getStudents(this.selectedSemester, this.selectedAcadYear).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          this.students = response.payload.map((student: any) => ({
            id: student.id,
            studentNumber: student.student_number,
            lastName: student.last_name,
            firstName: student.first_name,
            middleName: student.middle_name || '',
            year: student.year_level,
            section: student.section,
            program: student.program,
            major: student.major || '',
            semester: student.semester,
            academicYear: student.academic_year,
            status: student.status,
            clearances: []
          }));
          
          // Load clearances for each student
          this.students.forEach(student => {
            this.loadStudentClearances(student);
          });
        } else {
          // No students found for this filter
          this.students = [];
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.students = [];
      }
    });
  }

  loadStudentClearances(student: Student) {
    // Use the student's own semester and academic year, not the filter
    const studentSemester = student.semester || this.selectedSemester;
    const studentAcadYear = student.academicYear || this.selectedAcadYear;
    
    this.apiService.getClearancesByStudent(student.id, studentSemester, studentAcadYear).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          student.clearances = response.payload.map((clearance: any) => ({
            clearance_id: clearance.clearance_id,
            office: clearance.title,
            status: clearance.status,
            date: clearance.approved_date ? new Date(clearance.approved_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : undefined,
            remarks: clearance.remarks || clearance.description,
            checked: false
          }));
        }
      },
      error: (error) => console.error('Error loading clearances:', error)
    });
  }

  // Handle filter changes
  onFilterChange() {
    this.loadStudents();
  }

  // Global filters
  selectedSemester: string = '1st Semester';
  selectedAcadYear: string = '2024-2025';
  semesters = ['1st Semester', '2nd Semester', 'Inter-Semester'];
  academicYears = ['2024-2025', '2025-2026', '2026-2027'];
  
  searchTerm: string = '';
  filterStatus: string = 'all';
  filterYear: string = 'all';
  filterSection: string = 'all';
  filterProgram: string = 'all';
  filterMajor: string = 'all';
  showModal: boolean = false;
  selectedStudent: Student | null = null;
  modalMode: 'view' | 'edit' = 'view';
  
  editForm = {
    studentNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    program: '',
    year: 0,
    section: '',
    major: '',
    semester: '',
    academicYear: ''
  };
  
  // Bulk approval
  selectAll: boolean = false;

  students: Student[] = [];

  get filteredStudents(): Student[] {
    return this.students.filter(student => {
      const matchesSearch = 
        student.studentNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.middleName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.filterStatus === 'all' || student.status === this.filterStatus;
      const matchesYear = this.filterYear === 'all' || student.year.toString() === this.filterYear;
      const matchesSection = this.filterSection === 'all' || student.section === this.filterSection;
      const matchesProgram = this.filterProgram === 'all' || student.program === this.filterProgram;
      const matchesMajor = this.filterMajor === 'all' || student.major === this.filterMajor;

      return matchesSearch && matchesStatus && matchesYear && matchesSection && matchesProgram && matchesMajor;
    });
  }

  viewStudent(student: Student): void {
    this.modalMode = 'view';
    this.selectedStudent = student;
    
    // Reload clearances for the student with their semester/academic year
    const studentSemester = student.semester || this.selectedSemester;
    const studentAcadYear = student.academicYear || this.selectedAcadYear;
    
    console.log('Loading clearances for student:', {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      semester: studentSemester,
      academicYear: studentAcadYear
    });
    
    this.apiService.getClearancesByStudent(student.id, studentSemester, studentAcadYear).subscribe({
      next: (response) => {
        console.log('Clearances response:', response);
        if (response.status.remarks === 'success' && this.selectedStudent) {
          this.selectedStudent.clearances = response.payload.map((clearance: any) => ({
            clearance_id: clearance.clearance_id,
            office: clearance.title,
            status: clearance.status,
            date: clearance.approved_date ? new Date(clearance.approved_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : undefined,
            remarks: clearance.remarks || clearance.description,
            checked: false
          }));
        }
      },
      error: (error) => console.error('Error loading clearances:', error)
    });
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStudent = null;
    this.modalMode = 'view';
  }
  
  // Get student initials for avatar
  getStudentInitials(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
  }
  
  // Save changes - approve checked requirements
  saveChanges(): void {
    if (!this.selectedStudent) return;
    
    const currentUser = this.authService.getAdminUser();
    if (!currentUser || !currentUser.admin_id) {
      alert('Admin not logged in');
      return;
    }

    // Get clearance IDs that are checked and pending
    const clearanceIds = this.selectedStudent.clearances
      .filter(c => c.checked && c.status === 'Pending' && c.clearance_id)
      .map(c => c.clearance_id!);

    if (clearanceIds.length === 0) {
      alert('No pending requirements selected');
      return;
    }

    // Call backend API to approve clearances
    this.apiService.approveMultipleClearances(clearanceIds, currentUser.admin_id, 'Approved by SBO').subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          alert(`${clearanceIds.length} requirement(s) approved successfully!`);
          this.closeModal();
          this.loadStudents(); // Reload all students to reflect changes
        } else {
          alert('Failed to approve: ' + response.status.message);
        }
      },
      error: (error) => {
        console.error('Error approving clearances:', error);
        alert('An error occurred while approving clearances');
      }
    });
  }

  editStudent(student: Student): void {
    this.modalMode = 'edit';
    this.selectedStudent = student;
    
    // Populate edit form with student data
    this.editForm = {
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      program: student.program,
      year: student.year,
      section: student.section,
      major: student.major || '',
      semester: student.semester || '',
      academicYear: student.academicYear || ''
    };
    
    this.showModal = true;
  }

  saveStudentEdit(): void {
    if (!this.selectedStudent) return;

    // Validate required fields
    if (!this.editForm.studentNumber || !this.editForm.firstName || !this.editForm.lastName || 
        !this.editForm.program || !this.editForm.year || !this.editForm.section || 
        !this.editForm.semester || !this.editForm.academicYear) {
      alert('❌ Please fill in all required fields');
      return;
    }

    this.apiService.updateStudent({
      id: this.selectedStudent.id,
      studentNumber: this.editForm.studentNumber,
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      middleName: this.editForm.middleName,
      program: this.editForm.program,
      year: this.editForm.year,
      section: this.editForm.section,
      major: this.editForm.major,
      semester: this.editForm.semester,
      academicYear: this.editForm.academicYear
    }).subscribe({
      next: (response) => {
        if (response.status.remarks === 'success') {
          alert('✅ Student updated successfully!');
          
          // If semester or academic year changed, update the filter to show the student
          if (this.editForm.semester !== this.selectedSemester || 
              this.editForm.academicYear !== this.selectedAcadYear) {
            this.selectedSemester = this.editForm.semester;
            this.selectedAcadYear = this.editForm.academicYear;
          }
          
          this.closeModal();
          this.loadStudents();
        } else {
          alert('❌ Failed to update student: ' + response.status.message);
        }
      },
      error: (error) => {
        console.error('Update error:', error);
        alert('❌ Error updating student');
      }
    });
  }

  deleteStudent(student: Student): void {
    if (confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}? This will also delete all their clearance records.`)) {
      this.apiService.deleteStudent(student.id).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            alert('Student deleted successfully');
            this.loadStudents();
          } else {
            alert('Failed to delete student: ' + response.status.message);
          }
        },
        error: (error) => {
          console.error('Delete error:', error);
          alert('Error deleting student');
        }
      });
    }
  }

  // Update remarks for a clearance
  updateRemarks(clearance: Clearance): void {
    const newRemarks = prompt('Enter remarks:', clearance.remarks || '');
    if (newRemarks !== null) {
      clearance.remarks = newRemarks;
    }
  }
  
  // Toggle select all checkboxes
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.filteredStudents.forEach(student => {
      // Only allow selection if all clearances are approved
      if (this.isAllClearancesApproved(student)) {
        student.selected = this.selectAll;
      }
    });
  }
  
  // Toggle individual student selection
  toggleStudentSelection(student: Student): void {
    student.selected = !student.selected;
    // Update selectAll checkbox state
    this.selectAll = this.filteredStudents
      .filter(s => this.isAllClearancesApproved(s))
      .every(s => s.selected);
  }
  
  // Check if all clearances are approved
  isAllClearancesApproved(student: Student): boolean {
    return student.clearances.every(c => c.status === 'Approved');
  }
  
  // Get selected students count
  get selectedStudentsCount(): number {
    return this.filteredStudents.filter(s => s.selected).length;
  }
  
  // Bulk approve selected students
  bulkApproveStudents(): void {
    const selectedStudents = this.filteredStudents.filter(s => s.selected);
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to approve');
      return;
    }
    
    const currentUser = this.authService.getAdminUser();
    if (!currentUser || !currentUser.admin_id) {
      alert('Admin not logged in');
      return;
    }

    if (confirm(`Are you sure you want to approve ${selectedStudents.length} student(s)? This will approve all their pending clearances.`)) {
      const studentIds = selectedStudents.map(s => s.id);
      
      this.apiService.bulkApproveStudents(studentIds, currentUser.admin_id).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            alert(`${selectedStudents.length} student(s) have been approved successfully!`);
            this.selectAll = false;
            this.loadStudents(); // Reload to reflect changes
          } else {
            alert('Failed to approve: ' + response.status.message);
          }
        },
        error: (error) => {
          console.error('Error bulk approving:', error);
          alert('An error occurred during bulk approval');
        }
      });
    }
  }
}

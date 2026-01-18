import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
export class ApiService {
  // private apiUrl = 'https://api.lspu-ccsclearance.online/clearance_api/api/';
     private apiUrl = 'http://localhost/clearance_management/clearance_api/api/';


  constructor(private http: HttpClient) {}

  // ============ STUDENTS ============

  getStudents(semester?: string, academicYear?: string, status?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'students');
    if (semester) params = params.set('semester', semester);
    if (academicYear) params = params.set('academicYear', academicYear);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getStudentById(id: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', `student/${id}`);
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getStudentWithClearances(studentId: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', `student-with-clearances/${studentId}`);
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getClearancesByStudent(studentId: number, semester?: string, academicYear?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'student-clearances').set('id', studentId.toString());
    if (semester) params = params.set('semester', semester);
    if (academicYear) params = params.set('academicYear', academicYear);

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  // ============ REQUIREMENTS ============
 
  getRequirements(semester?: string, academicYear?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'requirements');
    if (semester) params = params.set('semester', semester);
    if (academicYear) params = params.set('academicYear', academicYear);

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getRequirementById(id: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', `requirement/${id}`);
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  createRequirement(data: {
    title: string;
    description: string;
    semester: string;
    academicYear: string;
  }): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'create-requirement');
    return this.http.post<ApiResponse>(this.apiUrl, data, { params });
  }

  updateRequirement(data: {
    id: number;
    title: string;
    description: string;
  }): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'update-requirement');
    return this.http.post<ApiResponse>(this.apiUrl, data, { params });
  }

  deleteRequirement(id: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'delete-requirement');
    return this.http.post<ApiResponse>(this.apiUrl, { id }, { params });
  }

  // ============ CLEARANCE APPROVAL ============

  approveClearance(clearanceId: number, adminId: number, remarks?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'approve-clearance');
    return this.http.post<ApiResponse>(this.apiUrl, {
      clearanceId,
      adminId,
      remarks
    }, { params });
  }

  approveMultipleClearances(clearanceIds: number[], adminId: number, remarks?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'approve-multiple-clearances');
    return this.http.post<ApiResponse>(this.apiUrl, {
      clearanceIds,
      adminId,
      remarks
    }, { params });
  }

  bulkApproveStudents(studentIds: number[], adminId: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'bulk-approve-students');
    return this.http.post<ApiResponse>(this.apiUrl, {
      studentIds,
      adminId
    }, { params });
  }

  unapproveClearance(clearanceId: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'unapprove-clearance');
    return this.http.post<ApiResponse>(this.apiUrl, {
      clearanceId
    }, { params });
  }

  // ============ DASHBOARD ============

  getDashboardStats(semester?: string, academicYear?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'dashboard-stats');
    if (semester) params = params.set('semester', semester);
    if (academicYear) params = params.set('academicYear', academicYear);

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  getRecentActivities(limit: number = 10): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('request', 'recent-activities')
      .set('limit', limit.toString());
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  // ============ APPROVED STUDENTS ============

  getApprovedStudents(semester?: string, academicYear?: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'approved-students');
    if (semester) params = params.set('semester', semester);
    if (academicYear) params = params.set('academicYear', academicYear);

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  // ============ TEMPLATES ============

  getActiveTemplate(): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'active-template');
    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

  saveTemplate(data: {
    fileName: string;
    filePath: string;
    fileType: string;
  }): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'save-template');
    return this.http.post<ApiResponse>(this.apiUrl, data, { params });
  }

  // Upload template file (actual file upload with multipart/form-data)
  uploadTemplateFile(file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('template', file);
    let params = new HttpParams().set('request', 'upload-template');
    return this.http.post<ApiResponse>(this.apiUrl, formData, { params });
  }

  // Change admin password
  changeAdminPassword(adminId: number, currentPassword: string, newPassword: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'change-admin-password');
    return this.http.post<ApiResponse>(this.apiUrl, { adminId, currentPassword, newPassword }, { params });
  }

  // Change student password
  changeStudentPassword(studentId: number, currentPassword: string, newPassword: string): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'change-student-password');
    return this.http.post<ApiResponse>(this.apiUrl, { studentId, currentPassword, newPassword }, { params });
  }

  // Update student
  updateStudent(data: any): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'update-student');
    return this.http.post<ApiResponse>(this.apiUrl, data, { params });
  }

  // Delete student
  deleteStudent(id: number): Observable<ApiResponse> {
    let params = new HttpParams().set('request', 'delete-student');
    return this.http.post<ApiResponse>(this.apiUrl, { id }, { params });
  }
}

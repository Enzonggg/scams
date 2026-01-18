<?php

require_once "global.php";

class Post extends GlobalMethods
{
    private $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Helper method to log activities
    private function logActivity($adminId, $studentId, $actionType, $description, $semester = null, $academicYear = null) {
        try {
            $sql = "INSERT INTO activities (admin_id, student_id, action_type, description, semester, academic_year) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$adminId, $studentId, $actionType, $description, $semester, $academicYear]);
            return true;
        } catch (\PDOException $e) {
            // Silently fail - don't break the main operation
            error_log("Activity logging failed: " . $e->getMessage());
            return false;
        }
    }

    // Admin Login
    public function adminLogin($data) {
        if (!isset($data->username) || !isset($data->password)) {
            return $this->sendPayload(null, "failed", "Username and password are required", 400);
        }

        $sql = "SELECT * FROM admin WHERE username = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$data->username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($data->password, $admin['password'])) {
            // Don't return password hash
            unset($admin['password']);
            return $this->sendPayload($admin, "success", "Login successful", 200);
        } else {
            return $this->sendPayload(null, "failed", "Invalid username or password", 401);
        }
    }

    // Student Login
    public function studentLogin($data) {
        if (!isset($data->studentNumber) || !isset($data->password)) {
            return $this->sendPayload(null, "failed", "Student number and password are required", 400);
        }

        $sql = "SELECT * FROM students WHERE student_number = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$data->studentNumber]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($student && password_verify($data->password, $student['password'])) {
            // Don't return password hash
            unset($student['password']);
            return $this->sendPayload($student, "success", "Login successful", 200);
        } else {
            return $this->sendPayload(null, "failed", "Invalid student number or password", 401);
        }
    }

    // Student Registration
    public function studentRegister($data) {
        // Validate required fields
        if (!isset($data->studentNumber) || !isset($data->lastName) || 
            !isset($data->firstName) || !isset($data->program) || 
            !isset($data->yearLevel) || !isset($data->section) || 
            !isset($data->semester) || !isset($data->academicYear) || !isset($data->password)) {
            return $this->sendPayload(null, "failed", "All required fields must be filled", 400);
        }

        // Check if student number already exists
        $checkSql = "SELECT student_number FROM students WHERE student_number = ?";
        $checkStmt = $this->pdo->prepare($checkSql);
        $checkStmt->execute([$data->studentNumber]);
        
        if ($checkStmt->fetch()) {
            return $this->sendPayload(null, "failed", "Student number already exists", 409);
        }

        // Hash password
        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);

        // Insert new student
        $sql = "INSERT INTO students (student_number, last_name, first_name, middle_name, password, program, year_level, section, major, semester, academic_year) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([
            $data->studentNumber,
            $data->lastName,
            $data->firstName,
            $data->middleName ?? '',
            $hashedPassword,
            $data->program,
            $data->yearLevel,
            $data->section,
            $data->major ?? '',
            $data->semester,
            $data->academicYear
        ]);

        if ($result) {
            return $this->sendPayload([
                "student_id" => $this->pdo->lastInsertId(),
                "student_number" => $data->studentNumber
            ], "success", "Registration successful", 201);
        } else {
            return $this->sendPayload(null, "failed", "Registration failed", 500);
        }
    }

    // Admin Registration
    public function adminRegister($data) {
        // Validate required fields
        if (!isset($data->username) || !isset($data->password) || !isset($data->fullName)) {
            return $this->sendPayload(null, "failed", "Username, password, and full name are required", 400);
        }

        // Check if username already exists
        $checkSql = "SELECT username FROM admin WHERE username = ?";
        $checkStmt = $this->pdo->prepare($checkSql);
        $checkStmt->execute([$data->username]);
        
        if ($checkStmt->fetch()) {
            return $this->sendPayload(null, "failed", "Username already exists", 409);
        }

        // Hash password
        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);

        // Insert new admin
        $sql = "INSERT INTO admin (username, password, full_name) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([
            $data->username,
            $hashedPassword,
            $data->fullName
        ]);

        if ($result) {
            return $this->sendPayload([
                "admin_id" => $this->pdo->lastInsertId(),
                "username" => $data->username
            ], "success", "Admin registration successful", 201);
        } else {
            return $this->sendPayload(null, "failed", "Registration failed", 500);
        }
    }

    // ============ REQUIREMENTS MANAGEMENT ============
    
    // Create new requirement
    public function createRequirement($data) {
        if (!isset($data->title) || !isset($data->description) || 
            !isset($data->semester) || !isset($data->academicYear)) {
            return $this->sendPayload(null, "failed", "All fields are required", 400);
        }

        $sql = "INSERT INTO requirements (title, description, semester, academic_year) VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([
            $data->title,
            $data->description,
            $data->semester,
            $data->academicYear
        ]);

        if ($result) {
            $requirementId = $this->pdo->lastInsertId();
            
            // Auto-create clearances for all students in this semester/year
            $studentsSql = "SELECT id FROM students WHERE semester = ? AND academic_year = ?";
            $studentsStmt = $this->pdo->prepare($studentsSql);
            $studentsStmt->execute([$data->semester, $data->academicYear]);
            $students = $studentsStmt->fetchAll();
            
            $approvedStudentsReverted = 0;
            
            foreach ($students as $student) {
                $clearanceSql = "INSERT INTO clearances (student_id, requirement_id, semester, academic_year, status) 
                                VALUES (?, ?, ?, ?, 'Pending')";
                $clearanceStmt = $this->pdo->prepare($clearanceSql);
                $clearanceStmt->execute([$student['id'], $requirementId, $data->semester, $data->academicYear]);
                
                // Revert student status from 'Approved' back to 'Pending' since they now have a new incomplete requirement
                $updateStatusSql = "UPDATE students SET status = 'Pending' WHERE id = ? AND status = 'Approved'";
                $updateStatusStmt = $this->pdo->prepare($updateStatusSql);
                $updateStatusStmt->execute([$student['id']]);
                
                if ($updateStatusStmt->rowCount() > 0) {
                    $approvedStudentsReverted++;
                }
            }

            return $this->sendPayload([
                "requirement_id" => $requirementId,
                "students_affected" => count($students),
                "approved_students_reverted" => $approvedStudentsReverted
            ], "success", "Requirement created successfully", 201);
        }
        
        return $this->sendPayload(null, "failed", "Failed to create requirement", 500);
    }

    // Update requirement
    public function updateRequirement($data) {
        if (!isset($data->id) || !isset($data->title) || !isset($data->description)) {
            return $this->sendPayload(null, "failed", "Requirement ID, title, and description are required", 400);
        }

        $sql = "UPDATE requirements SET title = ?, description = ? WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([$data->title, $data->description, $data->id]);

        if ($result) {
            return $this->sendPayload(["requirement_id" => $data->id], "success", "Requirement updated successfully", 200);
        }
        
        return $this->sendPayload(null, "failed", "Failed to update requirement", 500);
    }

    // Delete requirement
    public function deleteRequirement($data) {
        if (!isset($data->id)) {
            return $this->sendPayload(null, "failed", "Requirement ID is required", 400);
        }

        // Get affected students before deleting (students who had this clearance)
        $affectedStudentsSql = "SELECT DISTINCT student_id FROM clearances WHERE requirement_id = ?";
        $affectedStmt = $this->pdo->prepare($affectedStudentsSql);
        $affectedStmt->execute([$data->id]);
        $affectedStudents = $affectedStmt->fetchAll();

        // Delete requirement (this will also delete associated clearances via CASCADE)
        $sql = "DELETE FROM requirements WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([$data->id]);

        if ($result) {
            // Update status for affected students
            // Check if each student still has all their remaining clearances approved
            foreach ($affectedStudents as $student) {
                $studentId = $student['student_id'];
                
                // Count total clearances vs approved clearances for this student
                $checkSql = "SELECT COUNT(*) as total, 
                            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved 
                            FROM clearances WHERE student_id = ?";
                $checkStmt = $this->pdo->prepare($checkSql);
                $checkStmt->execute([$studentId]);
                $counts = $checkStmt->fetch();
                
                // Update student status based on clearances
                if ($counts['total'] == 0) {
                    // No clearances left - set to Pending
                    $updateSql = "UPDATE students SET status = 'Pending' WHERE id = ?";
                } else if ($counts['total'] == $counts['approved']) {
                    // All clearances approved
                    $updateSql = "UPDATE students SET status = 'Approved' WHERE id = ?";
                } else {
                    // Some clearances pending
                    $updateSql = "UPDATE students SET status = 'Pending' WHERE id = ?";
                }
                
                $updateStmt = $this->pdo->prepare($updateSql);
                $updateStmt->execute([$studentId]);
            }

            return $this->sendPayload(null, "success", "Requirement deleted successfully", 200);
        }
        
        return $this->sendPayload(null, "failed", "Failed to delete requirement", 500);
    }

    // ============ CLEARANCE APPROVAL ============
    
    // Approve single clearance
    public function approveClearance($data) {
        if (!isset($data->clearanceId) || !isset($data->adminId)) {
            return $this->sendPayload(null, "failed", "Clearance ID and Admin ID are required", 400);
        }

        $remarks = $data->remarks ?? 'Approved';
        
        $sql = "UPDATE clearances SET status = 'Approved', approved_date = NOW(), 
                approved_by = ?, remarks = ? WHERE clearance_id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([$data->adminId, $remarks, $data->clearanceId]);

        if ($result) {
            // Check if all clearances for this student are approved
            $checkSql = "SELECT c.student_id, c.semester, c.academic_year, s.first_name, s.last_name, r.title 
                         FROM clearances c 
                         JOIN students s ON c.student_id = s.id 
                         JOIN requirements r ON c.requirement_id = r.id 
                         WHERE c.clearance_id = ?";
            $checkStmt = $this->pdo->prepare($checkSql);
            $checkStmt->execute([$data->clearanceId]);
            $clearance = $checkStmt->fetch();
            
            if ($clearance) {
                // Log activity
                $studentName = $clearance['first_name'] . ' ' . $clearance['last_name'];
                $description = "Approved '{$clearance['title']}' for {$studentName}";
                $this->logActivity(
                    $data->adminId, 
                    $clearance['student_id'], 
                    'approved', 
                    $description,
                    $clearance['semester'],
                    $clearance['academic_year']
                );

                $allApprovedSql = "SELECT COUNT(*) as total, 
                                  SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved 
                                  FROM clearances WHERE student_id = ?";
                $allApprovedStmt = $this->pdo->prepare($allApprovedSql);
                $allApprovedStmt->execute([$clearance['student_id']]);
                $counts = $allApprovedStmt->fetch();
                
                if ($counts['total'] == $counts['approved']) {
                    $updateStudentSql = "UPDATE students SET status = 'Approved' WHERE id = ?";
                    $updateStudentStmt = $this->pdo->prepare($updateStudentSql);
                    $updateStudentStmt->execute([$clearance['student_id']]);
                    
                    // Log student fully approved
                    $this->logActivity(
                        $data->adminId,
                        $clearance['student_id'],
                        'approved',
                        "Student {$studentName} fully cleared",
                        $clearance['semester'],
                        $clearance['academic_year']
                    );
                }
            }

            return $this->sendPayload(["clearance_id" => $data->clearanceId], "success", "Clearance approved", 200);
        }
        
        return $this->sendPayload(null, "failed", "Failed to approve clearance", 500);
    }

    // Approve multiple clearances
    public function approveMultipleClearances($data) {
        if (!isset($data->clearanceIds) || !isset($data->adminId)) {
            return $this->sendPayload(null, "failed", "Clearance IDs and Admin ID are required", 400);
        }

        $approvedCount = 0;
        $remarks = $data->remarks ?? 'Approved';

        foreach ($data->clearanceIds as $clearanceId) {
            // Get clearance details before updating
            $detailsSql = "SELECT c.student_id, c.semester, c.academic_year, s.first_name, s.last_name, r.title 
                          FROM clearances c 
                          JOIN students s ON c.student_id = s.id 
                          JOIN requirements r ON c.requirement_id = r.id 
                          WHERE c.clearance_id = ?";
            $detailsStmt = $this->pdo->prepare($detailsSql);
            $detailsStmt->execute([$clearanceId]);
            $details = $detailsStmt->fetch();

            $sql = "UPDATE clearances SET status = 'Approved', approved_date = NOW(), 
                    approved_by = ?, remarks = ? WHERE clearance_id = ?";
            $stmt = $this->pdo->prepare($sql);
            
            if ($stmt->execute([$data->adminId, $remarks, $clearanceId])) {
                $approvedCount++;
                
                // Log activity for each clearance
                if ($details) {
                    $studentName = $details['first_name'] . ' ' . $details['last_name'];
                    $description = "Approved '{$details['title']}' for {$studentName}";
                    $this->logActivity(
                        $data->adminId,
                        $details['student_id'],
                        'approved',
                        $description,
                        $details['semester'],
                        $details['academic_year']
                    );
                }
            }
        }

        // Check student status
        if ($approvedCount > 0) {
            $studentIdSql = "SELECT DISTINCT student_id FROM clearances WHERE clearance_id IN (" . 
                           implode(',', array_fill(0, count($data->clearanceIds), '?')) . ")";
            $studentIdStmt = $this->pdo->prepare($studentIdSql);
            $studentIdStmt->execute($data->clearanceIds);
            $students = $studentIdStmt->fetchAll();

            foreach ($students as $student) {
                $checkSql = "SELECT COUNT(*) as total, 
                            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved 
                            FROM clearances WHERE student_id = ?";
                $checkStmt = $this->pdo->prepare($checkSql);
                $checkStmt->execute([$student['student_id']]);
                $counts = $checkStmt->fetch();
                
                if ($counts['total'] == $counts['approved']) {
                    $updateSql = "UPDATE students SET status = 'Approved' WHERE id = ?";
                    $updateStmt = $this->pdo->prepare($updateSql);
                    $updateStmt->execute([$student['student_id']]);
                }
            }
        }

        return $this->sendPayload([
            "approved_count" => $approvedCount
        ], "success", "$approvedCount clearance(s) approved", 200);
    }

    // Bulk approve students (approve all clearances for selected students)
    public function bulkApproveStudents($data) {
        if (!isset($data->studentIds) || !isset($data->adminId)) {
            return $this->sendPayload(null, "failed", "Student IDs and Admin ID are required", 400);
        }

        $approvedCount = 0;

        foreach ($data->studentIds as $studentId) {
            // Get student info
            $studentSql = "SELECT first_name, last_name, semester, academic_year FROM students WHERE id = ?";
            $studentStmt = $this->pdo->prepare($studentSql);
            $studentStmt->execute([$studentId]);
            $student = $studentStmt->fetch();

            // Approve all clearances for this student
            $sql = "UPDATE clearances SET status = 'Approved', approved_date = NOW(), 
                    approved_by = ?, remarks = 'Bulk approved' 
                    WHERE student_id = ? AND status = 'Pending'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data->adminId, $studentId]);

            // Update student status
            $updateSql = "UPDATE students SET status = 'Approved' WHERE id = ?";
            $updateStmt = $this->pdo->prepare($updateSql);
            
            if ($updateStmt->execute([$studentId])) {
                $approvedCount++;
                
                // Log activity
                if ($student) {
                    $studentName = $student['first_name'] . ' ' . $student['last_name'];
                    $this->logActivity(
                        $data->adminId,
                        $studentId,
                        'approved',
                        "Bulk approved all clearances for {$studentName}",
                        $student['semester'],
                        $student['academic_year']
                    );
                }
            }
        }

        return $this->sendPayload([
            "approved_count" => $approvedCount
        ], "success", "$approvedCount student(s) approved", 200);
    }

    // Unapprove clearance (reverse approval)
    public function unapproveClearance($data) {
        if (!isset($data->clearanceId)) {
            return $this->sendPayload(null, "failed", "Clearance ID is required", 400);
        }

        $sql = "UPDATE clearances SET status = 'Pending', approved_date = NULL, 
                approved_by = NULL WHERE clearance_id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([$data->clearanceId]);

        if ($result) {
            // Also update student status to Pending
            $studentSql = "SELECT student_id FROM clearances WHERE clearance_id = ?";
            $studentStmt = $this->pdo->prepare($studentSql);
            $studentStmt->execute([$data->clearanceId]);
            $clearance = $studentStmt->fetch();
            
            if ($clearance) {
                $updateStudentSql = "UPDATE students SET status = 'Pending' WHERE id = ?";
                $updateStudentStmt = $this->pdo->prepare($updateStudentSql);
                $updateStudentStmt->execute([$clearance['student_id']]);
            }

            return $this->sendPayload(["clearance_id" => $data->clearanceId], "success", "Clearance unapproved", 200);
        }
        
        return $this->sendPayload(null, "failed", "Failed to unapprove clearance", 500);
    }

    // ============ TEMPLATE MANAGEMENT ============
    
    // Upload template (file upload handled separately, this saves metadata)
    public function saveTemplate($data) {
        if (!isset($data->fileName) || !isset($data->filePath) || !isset($data->fileType)) {
            return $this->sendPayload(null, "failed", "File information is required", 400);
        }

        // Deactivate all previous templates
        $deactivateSql = "UPDATE templates SET is_active = FALSE";
        $this->pdo->prepare($deactivateSql)->execute();

        // Insert new template
        $sql = "INSERT INTO templates (file_name, file_path, file_type, is_active) VALUES (?, ?, ?, TRUE)";
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([$data->fileName, $data->filePath, $data->fileType]);

        if ($result) {
            return $this->sendPayload([
                "template_id" => $this->pdo->lastInsertId()
            ], "success", "Template uploaded successfully", 201);
        }
        
        return $this->sendPayload(null, "failed", "Failed to save template", 500);
    }

    // Upload template file (handles actual file upload)
    public function uploadTemplateFile() {
        // Check if file was uploaded
        if (!isset($_FILES['template']) || $_FILES['template']['error'] !== UPLOAD_ERR_OK) {
            return $this->sendPayload(null, "failed", "No file uploaded or upload error", 400);
        }

        $file = $_FILES['template'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileSize = $file['size'];
        $fileError = $file['error'];

        // Get file extension
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // Allowed file types
        $allowed = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'];
        
        if (!in_array($fileExt, $allowed)) {
            return $this->sendPayload(null, "failed", "Invalid file type. Allowed: PDF, DOCX, DOC, PNG, JPG", 400);
        }

        // Max file size: 10MB
        if ($fileSize > 10485760) {
            return $this->sendPayload(null, "failed", "File size exceeds 10MB limit", 400);
        }

        // Generate unique filename
        $uniqueFileName = 'template_' . time() . '_' . uniqid() . '.' . $fileExt;
        $uploadPath = __DIR__ . '/../../uploads/templates/' . $uniqueFileName;

        // Move uploaded file
        if (move_uploaded_file($fileTmpName, $uploadPath)) {
            // Deactivate all previous templates
            $deactivateSql = "UPDATE templates SET is_active = FALSE";
            $this->pdo->prepare($deactivateSql)->execute();

            // Save to database
            $sql = "INSERT INTO templates (file_name, file_path, file_type, is_active) VALUES (?, ?, ?, TRUE)";
            $stmt = $this->pdo->prepare($sql);
            
            $relativePath = 'uploads/templates/' . $uniqueFileName;
            $result = $stmt->execute([$fileName, $relativePath, $fileExt]);

            if ($result) {
                return $this->sendPayload([
                    "template_id" => $this->pdo->lastInsertId(),
                    "file_name" => $fileName,
                    "file_path" => $relativePath,
                    "file_type" => $fileExt
                ], "success", "Template uploaded successfully", 201);
            } else {
                // Delete uploaded file if database insert fails
                unlink($uploadPath);
                return $this->sendPayload(null, "failed", "Failed to save template to database", 500);
            }
        }

        return $this->sendPayload(null, "failed", "Failed to upload file", 500);
    }

    // Change admin password
    public function changeAdminPassword($data) {
        if (!isset($data->adminId) || !isset($data->currentPassword) || !isset($data->newPassword)) {
            return $this->sendPayload(null, "failed", "All fields are required", 400);
        }

        // Get current admin data
        $sql = "SELECT * FROM admin WHERE admin_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$data->adminId]);
        $admin = $stmt->fetch();

        if (!$admin) {
            return $this->sendPayload(null, "failed", "Admin not found", 404);
        }

        // Verify current password
        if (!password_verify($data->currentPassword, $admin['password'])) {
            return $this->sendPayload(null, "failed", "Current password is incorrect", 401);
        }

        // Hash new password
        $hashedPassword = password_hash($data->newPassword, PASSWORD_DEFAULT);

        // Update password
        $updateSql = "UPDATE admin SET password = ? WHERE admin_id = ?";
        $updateStmt = $this->pdo->prepare($updateSql);
        $result = $updateStmt->execute([$hashedPassword, $data->adminId]);

        if ($result) {
            return $this->sendPayload(null, "success", "Password changed successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Failed to change password", 500);
    }

    // Change student password
    public function changeStudentPassword($data) {
        if (!isset($data->studentId) || !isset($data->currentPassword) || !isset($data->newPassword)) {
            return $this->sendPayload(null, "failed", "All fields are required", 400);
        }

        // Get current student data
        $sql = "SELECT * FROM students WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$data->studentId]);
        $student = $stmt->fetch();

        if (!$student) {
            return $this->sendPayload(null, "failed", "Student not found", 404);
        }

        // Verify current password
        if (!password_verify($data->currentPassword, $student['password'])) {
            return $this->sendPayload(null, "failed", "Current password is incorrect", 401);
        }

        // Hash new password
        $hashedPassword = password_hash($data->newPassword, PASSWORD_DEFAULT);

        // Update password
        $updateSql = "UPDATE students SET password = ? WHERE id = ?";
        $updateStmt = $this->pdo->prepare($updateSql);
        $result = $updateStmt->execute([$hashedPassword, $data->studentId]);

        if ($result) {
            return $this->sendPayload(null, "success", "Password changed successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Failed to change password", 500);
    }

    // Update student
    public function updateStudent($data) {
        if (!isset($data->id)) {
            return $this->sendPayload(null, "failed", "Student ID is required", 400);
        }

        $sql = "UPDATE students SET ";
        $updates = [];
        $params = [];

        if (isset($data->studentNumber)) {
            $updates[] = "student_number = ?";
            $params[] = $data->studentNumber;
        }
        if (isset($data->firstName)) {
            $updates[] = "first_name = ?";
            $params[] = $data->firstName;
        }
        if (isset($data->lastName)) {
            $updates[] = "last_name = ?";
            $params[] = $data->lastName;
        }
        if (isset($data->middleName)) {
            $updates[] = "middle_name = ?";
            $params[] = $data->middleName;
        }
        if (isset($data->year)) {
            $updates[] = "year_level = ?";
            $params[] = $data->year;
        }
        if (isset($data->section)) {
            $updates[] = "section = ?";
            $params[] = $data->section;
        }
        if (isset($data->program)) {
            $updates[] = "program = ?";
            $params[] = $data->program;
        }
        if (isset($data->major)) {
            $updates[] = "major = ?";
            $params[] = $data->major;
        }
        if (isset($data->semester)) {
            $updates[] = "semester = ?";
            $params[] = $data->semester;
        }
        if (isset($data->academicYear)) {
            $updates[] = "academic_year = ?";
            $params[] = $data->academicYear;
        }

        if (empty($updates)) {
            return $this->sendPayload(null, "failed", "No fields to update", 400);
        }

        $sql .= implode(", ", $updates) . " WHERE id = ?";
        $params[] = $data->id;

        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute($params);

        if ($result) {
            return $this->sendPayload(["student_id" => $data->id], "success", "Student updated successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Failed to update student", 500);
    }

    // Delete student
    public function deleteStudent($data) {
        if (!isset($data->id)) {
            return $this->sendPayload(null, "failed", "Student ID is required", 400);
        }

        // Delete will cascade to clearances due to foreign key
        $sql = "DELETE FROM students WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([$data->id]);

        if ($result) {
            return $this->sendPayload(null, "success", "Student deleted successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Failed to delete student", 500);
    }
    
}

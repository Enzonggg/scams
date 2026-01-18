<?php
// Retrieving records from database
require_once "global.php";

class Get extends GlobalMethods{
    private $pdo;

    public function __construct(\PDO $pdo){
        $this->pdo = $pdo;
    }

    public function executeQuery($sql, $params = []) {
        $data = array();
        $errmsg = "";
        $code = 0;

        try {
            if (!empty($params)) {
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                $result = $stmt->fetchAll();
            } else {
                $result = $this->pdo->query($sql)->fetchAll();
            }
            if ($result) {
                foreach ($result as $record) {
                    array_push($data, $record);
                }
                $code = 200;
                return array("code"=>$code, "data"=>$data);
            } else {
                $errmsg = "No records found";
                $code = 404;
            }
        } catch(\PDOException $e) {
            $errmsg = $e->getMessage();
            $code = 403;
        }
        return array("code"=>$code, "errmsg"=>$errmsg);
    }

    public function get_records($table, $condition=null){
        $sqlString = "SELECT * FROM $table";
        if($condition != null){
            $sqlString .= " WHERE " . $condition;
        }
        
        $result = $this->executeQuery($sqlString);

        if($result['code']==200){
            return $this->sendPayload($result['data'], "success", "Successfully retrieved records.", $result['code']);
        }
        
        return $this->sendPayload(null, "failed", "Failed to retrieve records.", $result['code']);
    }

    // ============ STUDENTS ============
    
    // Get all students with filters
    public function getStudents($semester = null, $academicYear = null, $status = null) {
        $sql = "SELECT * FROM students WHERE 1=1";
        $params = [];

        if ($semester) {
            $sql .= " AND semester = ?";
            $params[] = $semester;
        }

        if ($academicYear) {
            $sql .= " AND academic_year = ?";
            $params[] = $academicYear;
        }

        if ($status && $status !== 'all') {
            $sql .= " AND status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY last_name, first_name";

        $result = $this->executeQuery($sql, $params);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], "success", "Students retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", $result['errmsg'], $result['code']);
    }

    // Get single student by ID
    public function getStudentById($id) {
        $sql = "SELECT * FROM students WHERE id = ?";
        $result = $this->executeQuery($sql, [$id]);

        if ($result['code'] == 200 && !empty($result['data'])) {
            return $this->sendPayload($result['data'][0], "success", "Student retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Student not found", 404);
    }

    // Get student with clearances
    public function getStudentWithClearances($studentId) {
        // Get student info
        $studentSql = "SELECT * FROM students WHERE id = ?";
        $studentResult = $this->executeQuery($studentSql, [$studentId]);

        if ($studentResult['code'] != 200 || empty($studentResult['data'])) {
            return $this->sendPayload(null, "failed", "Student not found", 404);
        }

        $student = $studentResult['data'][0];

        // Get clearances with requirement details
        $clearancesSql = "SELECT c.*, r.title, r.description, a.full_name as approved_by_name
                         FROM clearances c
                         JOIN requirements r ON c.requirement_id = r.id
                         LEFT JOIN admin a ON c.approved_by = a.admin_id
                         WHERE c.student_id = ?
                         ORDER BY r.title";
        
        $clearancesResult = $this->executeQuery($clearancesSql, [$studentId]);

        $student['clearances'] = $clearancesResult['code'] == 200 ? $clearancesResult['data'] : [];

        return $this->sendPayload($student, "success", "Student with clearances retrieved", 200);
    }

    // ============ REQUIREMENTS ============
    
    // Get all requirements with filters
    public function getRequirements($semester = null, $academicYear = null) {
        $sql = "SELECT * FROM requirements WHERE 1=1";
        $params = [];

        if ($semester) {
            $sql .= " AND semester = ?";
            $params[] = $semester;
        }

        if ($academicYear) {
            $sql .= " AND academic_year = ?";
            $params[] = $academicYear;
        }

        $sql .= " ORDER BY date_posted DESC";

        $result = $this->executeQuery($sql, $params);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], "success", "Requirements retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", $result['errmsg'], $result['code']);
    }

    // Get requirement by ID
    public function getRequirementById($id) {
        $sql = "SELECT * FROM requirements WHERE id = ?";
        $result = $this->executeQuery($sql, [$id]);

        if ($result['code'] == 200 && !empty($result['data'])) {
            return $this->sendPayload($result['data'][0], "success", "Requirement retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", "Requirement not found", 404);
    }

    // ============ CLEARANCES ============
    
    // Get clearances by student
    public function getClearancesByStudent($studentId, $semester = null, $academicYear = null) {
        // Auto-generate missing clearances for requirements that exist but don't have clearances for this student
        if ($semester && $academicYear) {
            // Find requirements in this semester/academic year that don't have clearances for this student
            $missingSql = "SELECT r.id, r.semester, r.academic_year
                          FROM requirements r
                          WHERE r.semester = ? AND r.academic_year = ?
                          AND r.id NOT IN (
                              SELECT requirement_id 
                              FROM clearances 
                              WHERE student_id = ? AND semester = ? AND academic_year = ?
                          )";
            
            $missingStmt = $this->pdo->prepare($missingSql);
            $missingStmt->execute([$semester, $academicYear, $studentId, $semester, $academicYear]);
            $missingRequirements = $missingStmt->fetchAll();
            
            // Create clearances for any missing requirements
            foreach ($missingRequirements as $req) {
                $insertSql = "INSERT INTO clearances (student_id, requirement_id, semester, academic_year, status) 
                             VALUES (?, ?, ?, ?, 'Pending')";
                $insertStmt = $this->pdo->prepare($insertSql);
                $insertStmt->execute([$studentId, $req['id'], $req['semester'], $req['academic_year']]);
            }
        }
        
        // Now fetch the clearances
        $sql = "SELECT c.*, r.title, r.description, a.full_name as approved_by_name
                FROM clearances c
                JOIN requirements r ON c.requirement_id = r.id
                LEFT JOIN admin a ON c.approved_by = a.admin_id
                WHERE c.student_id = ?";
        
        $params = [$studentId];

        if ($semester) {
            $sql .= " AND c.semester = ?";
            $params[] = $semester;
        }

        if ($academicYear) {
            $sql .= " AND c.academic_year = ?";
            $params[] = $academicYear;
        }

        $sql .= " ORDER BY r.title";

        $result = $this->executeQuery($sql, $params);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], "success", "Clearances retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", $result['errmsg'], $result['code']);
    }

    // ============ DASHBOARD STATS ============
    
    // Get admin dashboard statistics
    public function getDashboardStats($semester = null, $academicYear = null) {
        $params = [];
        $whereClause = "WHERE 1=1";

        if ($semester) {
            $whereClause .= " AND semester = ?";
            $params[] = $semester;
        }

        if ($academicYear) {
            $whereClause .= " AND academic_year = ?";
            $params[] = $academicYear;
        }

        // Total students
        $totalStudentsSql = "SELECT COUNT(*) as total FROM students $whereClause";
        $totalStudentsResult = $this->executeQuery($totalStudentsSql, $params);
        $totalStudents = $totalStudentsResult['code'] == 200 ? $totalStudentsResult['data'][0]['total'] : 0;

        // Approved students
        $approvedWhereClause = $whereClause . " AND status = 'Approved'";
        $approvedSql = "SELECT COUNT(*) as total FROM students $approvedWhereClause";
        $approvedResult = $this->executeQuery($approvedSql, $params);
        $approvedStudents = $approvedResult['code'] == 200 ? $approvedResult['data'][0]['total'] : 0;

        // Pending students
        $pendingStudents = $totalStudents - $approvedStudents;

        // Total requirements
        $reqWhereClause = "WHERE 1=1";
        $reqParams = [];
        
        if ($semester) {
            $reqWhereClause .= " AND semester = ?";
            $reqParams[] = $semester;
        }

        if ($academicYear) {
            $reqWhereClause .= " AND academic_year = ?";
            $reqParams[] = $academicYear;
        }

        $requirementsSql = "SELECT COUNT(*) as total FROM requirements $reqWhereClause";
        $requirementsResult = $this->executeQuery($requirementsSql, $reqParams);
        $totalRequirements = $requirementsResult['code'] == 200 ? $requirementsResult['data'][0]['total'] : 0;

        $stats = [
            'totalStudents' => $totalStudents,
            'approvedStudents' => $approvedStudents,
            'pendingStudents' => $pendingStudents,
            'totalRequirements' => $totalRequirements
        ];

        return $this->sendPayload($stats, "success", "Dashboard stats retrieved", 200);
    }

    // Get recent activities
    public function getRecentActivities($limit = 10) {
        $sql = "SELECT a.*, s.student_number, s.first_name, s.last_name, ad.username as admin_username
                FROM activities a
                LEFT JOIN students s ON a.student_id = s.id
                LEFT JOIN admin ad ON a.admin_id = ad.admin_id
                ORDER BY a.created_at DESC
                LIMIT ?";
        
        $result = $this->executeQuery($sql, [$limit]);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], "success", "Activities retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", $result['errmsg'], $result['code']);
    }

    // ============ APPROVED STUDENTS ============
    
    // Get approved students only
    public function getApprovedStudents($semester = null, $academicYear = null) {
        $sql = "SELECT * FROM students WHERE status = 'Approved'";
        $params = [];

        if ($semester) {
            $sql .= " AND semester = ?";
            $params[] = $semester;
        }

        if ($academicYear) {
            $sql .= " AND academic_year = ?";
            $params[] = $academicYear;
        }

        $sql .= " ORDER BY last_name, first_name";

        $result = $this->executeQuery($sql, $params);

        if ($result['code'] == 200) {
            return $this->sendPayload($result['data'], "success", "Approved students retrieved", 200);
        }

        return $this->sendPayload(null, "failed", $result['errmsg'], $result['code']);
    }

    // ============ TEMPLATES ============
    
    // Get active template
    public function getActiveTemplate() {
        $sql = "SELECT * FROM templates WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1";
        $result = $this->executeQuery($sql);

        if ($result['code'] == 200 && !empty($result['data'])) {
            return $this->sendPayload($result['data'][0], "success", "Template retrieved successfully", 200);
        }

        return $this->sendPayload(null, "failed", "No active template found", 404);
    }
}

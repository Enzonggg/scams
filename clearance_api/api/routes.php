<?php   

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

// Include required modules
require_once "./modules/get.php";
require_once "./modules/post.php";
require_once "./config/database.php";

$con = new Connection();
$pdo = $con->connect();

// Initialize Get and Post objects
$get = new Get($pdo);
$post = new Post($pdo);

// Check if 'request' parameter is set in the request
if (isset($_REQUEST['request'])) {
    // Split the request into an array based on '/'
    $request = explode('/', $_REQUEST['request']);
} else {
    // If 'request' parameter is not set, return a 404 response
    echo "Not Found";
    http_response_code(404);
    exit();
}

// Handle requests based on HTTP method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        switch ($request[0]) {
            // Students
            case 'students':
                $semester = $_GET['semester'] ?? null;
                $academicYear = $_GET['academicYear'] ?? null;
                $status = $_GET['status'] ?? null;
                echo json_encode($get->getStudents($semester, $academicYear, $status));
                break;
            
            case 'student':
                if (isset($request[1])) {
                    echo json_encode($get->getStudentById($request[1]));
                }
                break;
            
            case 'student-clearances':
                $studentId = $_GET['id'] ?? null;
                if ($studentId) {
                    $semester = $_GET['semester'] ?? null;
                    $academicYear = $_GET['academicYear'] ?? null;
                    echo json_encode($get->getClearancesByStudent($studentId, $semester, $academicYear));
                }
                break;
            
            case 'student-with-clearances':
                if (isset($request[1])) {
                    echo json_encode($get->getStudentWithClearances($request[1]));
                }
                break;
            
            // Requirements
            case 'requirements':
                $semester = $_GET['semester'] ?? null;
                $academicYear = $_GET['academicYear'] ?? null;
                echo json_encode($get->getRequirements($semester, $academicYear));
                break;
            
            case 'requirement':
                if (isset($request[1])) {
                    echo json_encode($get->getRequirementById($request[1]));
                }
                break;
            
            // Dashboard
            case 'dashboard-stats':
                $semester = $_GET['semester'] ?? null;
                $academicYear = $_GET['academicYear'] ?? null;
                echo json_encode($get->getDashboardStats($semester, $academicYear));
                break;
            
            case 'recent-activities':
                $limit = $_GET['limit'] ?? 10;
                echo json_encode($get->getRecentActivities($limit));
                break;
            
            // Approved Students
            case 'approved-students':
                $semester = $_GET['semester'] ?? null;
                $academicYear = $_GET['academicYear'] ?? null;
                echo json_encode($get->getApprovedStudents($semester, $academicYear));
                break;
            
            // Templates
            case 'active-template':
                echo json_encode($get->getActiveTemplate());
                break;
            
            default:
                http_response_code(404);
                echo json_encode(["errmsg" => "Invalid route"]);
                break;
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {
            // Authentication
            case 'admin-login':
                echo json_encode($post->adminLogin($data));
                break;
            case 'admin-register':
                echo json_encode($post->adminRegister($data));
                break;
            case 'student-login':
                echo json_encode($post->studentLogin($data));
                break;
            case 'student-register':
                echo json_encode($post->studentRegister($data));
                break;
            
            // Requirements Management
            case 'create-requirement':
                echo json_encode($post->createRequirement($data));
                break;
            case 'update-requirement':
                echo json_encode($post->updateRequirement($data));
                break;
            case 'delete-requirement':
                echo json_encode($post->deleteRequirement($data));
                break;
            
            // Clearance Approval
            case 'approve-clearance':
                echo json_encode($post->approveClearance($data));
                break;
            case 'approve-multiple-clearances':
                echo json_encode($post->approveMultipleClearances($data));
                break;
            case 'bulk-approve-students':
                echo json_encode($post->bulkApproveStudents($data));
                break;
            case 'unapprove-clearance':
                echo json_encode($post->unapproveClearance($data));
                break;
            
            // Template Management
            case 'save-template':
                echo json_encode($post->saveTemplate($data));
                break;
            
            case 'upload-template':
                echo json_encode($post->uploadTemplateFile());
                break;
            
            // Password Management
            case 'change-admin-password':
                echo json_encode($post->changeAdminPassword($data));
                break;
            
            case 'change-student-password':
                echo json_encode($post->changeStudentPassword($data));
                break;
            
            // Student Management
            case 'update-student':
                echo json_encode($post->updateStudent($data));
                break;
            
            case 'delete-student':
                echo json_encode($post->deleteStudent($data));
                break;
            
            default:
                echo "This is forbidden";
                http_response_code(403);
                break;
        }
        break;

    default:
        echo "Method not available";
        http_response_code(404);
        break;
}

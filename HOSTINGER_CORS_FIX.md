# CORS Fix Instructions for Hostinger Deployment

## Issue
CORS error when accessing API from frontend: "No 'Access-Control-Allow-Origin' header is present"

## Solution - Follow these steps:

### 1. Upload Files to Hostinger
- Upload the entire `clearance_api` folder to your Hostinger hosting
- Make sure both `.htaccess` files are uploaded:
  - `clearance_api/.htaccess`
  - `clearance_api/api/.htaccess`

### 2. Enable Required Apache Modules (if you have cPanel access)
In Hostinger cPanel, go to Software → Select PHP Version and enable:
- `mod_rewrite`
- `mod_headers`

### 3. Alternative Fix (if .htaccess doesn't work)
If the .htaccess CORS headers don't work, add this at the VERY TOP of `routes.php` (before any other code):

```php
<?php
// CORS Headers - MUST be first
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

### 4. Check File Permissions
Make sure these permissions are set:
- Folders: 755
- PHP files: 644
- .htaccess files: 644

### 5. Test Your API
Test directly in browser:
```
https://api.lspu-ccsclearance.online/clearance_api/api/?request=students
```

If this works but registration doesn't, the CORS is fixed.

### 6. Common Hostinger Issues

**Issue: 404 Not Found**
- Make sure the `.htaccess` files are uploaded
- Check that mod_rewrite is enabled

**Issue: 500 Internal Server Error**
- Check PHP error logs in cPanel
- Make sure all files were uploaded completely
- Check file permissions

**Issue: Still getting CORS error**
- Add the PHP CORS headers at the top of routes.php (see step 3)
- Contact Hostinger support to enable mod_headers

### 7. Alternative: Use php.ini
If .htaccess doesn't work, create a `php.ini` file in the `clearance_api/api/` folder:

```ini
; Enable CORS
header("Access-Control-Allow-Origin: *");
```

### 8. Verify Database Connection
Make sure your `clearance_api/api/config/database.php` has correct Hostinger database credentials:
```php
$host = 'localhost'; // Usually localhost
$dbname = 'your_database_name';
$username = 'your_database_user';
$password = 'your_database_password';
```

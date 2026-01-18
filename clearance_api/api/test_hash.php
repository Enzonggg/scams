<?php
// Generate new password hashes
echo "=== Generating Password Hashes ===\n\n";

$password = 'password123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: $password\n";
echo "New Hash: $hash\n\n";

// Verify it works
if (password_verify($password, $hash)) {
    echo "✓ Verification successful!\n\n";
} else {
    echo "✗ Verification failed!\n\n";
}

// Test old hash
echo "=== Testing Old Hash ===\n";
$oldHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
echo "Old Hash: $oldHash\n";

$testPasswords = ['password123', 'admin123', 'password', 'admin'];
foreach ($testPasswords as $testPass) {
    if (password_verify($testPass, $oldHash)) {
        echo "✓ Old hash matches: $testPass\n";
    }
}

echo "\n=== SQL UPDATE Statement ===\n";
echo "UPDATE admin SET password = '$hash' WHERE username = 'admin';\n";
?>

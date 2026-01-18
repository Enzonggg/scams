# 📋 Clearance Template Feature - Implementation Guide

## What is it?

The **Clearance Template** feature allows SBO officers to upload a standardized certificate template that will be used to generate personalized clearance certificates for approved students.

## How It Works

### Admin Side (SBO Officers):

1. **Navigate to Requirements Management Page**
2. **Upload Template Section:**
   - Click "Choose File" 
   - Select a certificate template (PDF, DOCX, PNG, or JPG)
   - Click "Upload Template"
   - System stores template in database and uploads folder

3. **Template Management:**
   - View currently uploaded template
   - Download template to review
   - Remove/replace template if needed

### Student Side:

1. **Student completes all clearance requirements**
2. **SBO officer approves all clearances**
3. **Student's status automatically changes to "Approved"**
4. **"Download Certificate" button becomes active**
5. **Student clicks download:**
   - System retrieves the uploaded template
   - Populates it with student information:
     * Student Name
     * Student Number  
     * Program & Year Level
     * Approval Date
     * SBO Officer Name
   - Generates personalized PDF certificate
   - Student downloads their official clearance certificate

## Current Implementation Status

### ✅ What's Working:
- Database table for templates exists
- Backend API endpoint for template metadata (`saveTemplate`)
- Frontend UI for template upload

### ❌ What's NOT Working:
- **No actual file upload** - frontend only simulates
- **No file storage** - files not saved to server
- **No certificate generation** - no PDF creation
- **No template retrieval** - students can't download

## Why This Feature is Important (From Chapter 1)

> "The template upload feature is particularly beneficial as it allows them to create one standardized clearance certificate format and reuse it for all students, ensuring consistency and professionalism while saving significant time."

**Benefits:**
- **For SBO:** No more manually creating certificates in Word for each student
- **For Students:** Professional, official-looking certificates
- **For College:** Consistent, standardized documentation
- **Saves Time:** One template, unlimited uses

## How to Properly Implement

### Phase 1: File Upload (Priority)
1. Create `uploads/templates/` folder in clearance_api
2. Add PHP file upload handling in backend
3. Connect frontend to upload actual files
4. Store file path in database

### Phase 2: Certificate Generation (Optional Enhancement)
1. Install PDF library (FPDF or TCPDF for PHP)
2. Create certificate generator endpoint
3. Parse template and inject student data
4. Generate downloadable PDF

### Phase 3: Student Download
1. Add "Download Certificate" button (visible only when Approved)
2. Call certificate generation API
3. Download generated PDF with student's name

## Simplified Alternative (Quick Solution)

If full automation is complex, use this approach:

**Admin:**
- Upload template for reference only
- Manually create certificates using the template

**Student:**  
- View "Approved" status
- Visit SBO office to collect printed certificate
- Or use window.print() to print their dashboard

This maintains the digital tracking while certificates remain manual (current behavior).

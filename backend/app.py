# app.py
"""
FastAPI server for Expo Go frontend integration.
This provides REST API endpoints for face recognition attendance system.

Expo Go Connection:
- Your React Native app will make HTTP requests to these endpoints
- Base URL: http://your-server-ip:8000 (local) or your-deployed-url (production)
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
from datetime import datetime
from typing import List, Optional

# Import our services
from database import MongoDB
from face_service import FaceService

# Initialize FastAPI app
app = FastAPI(
    title="Face Recognition Attendance API",
    description="API for student registration and attendance marking via face recognition",
    version="1.0.0"
)

# CORS middleware - CRITICAL for Expo Go
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:19006", # Expo web
        "exp://*",               # Expo apps
        "http://*",              # All HTTP origins
        "https://*",             # All HTTPS origins
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize services
db = MongoDB()
face_service = FaceService(db)

# Expo Go Connection Note:
# Replace the MongoDB connection string in database.py for production
# For local development, ensure MongoDB is running on localhost:27017

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "active", 
        "service": "Face Recognition Attendance API",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        stats = face_service.get_system_stats()
        return {
            "status": "healthy",
            "database": "connected",
            "total_students": stats.get("total_students", 0),
            "model": stats.get("model_name", "Unknown"),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Service unhealthy: {str(e)}")

@app.post("/register")
async def register_student(
    name: str = Form(..., description="Student's full name"),
    student_id: str = Form(..., description="Unique student ID"),
    images: List[UploadFile] = File(..., description="Multiple face images (10-20 recommended)")
):
    """
    Register a new student with multiple face images.
    
    Expo Go Usage:
    ```javascript
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('student_id', 'john_doe_001');
    
    // Add multiple images from camera/gallery
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `face_${index}.jpg`
      });
    });
    
    const response = await fetch('http://your-server:8000/register', {
      method: 'POST',
      body: formData,
    });
    ```
    """
    temp_paths = []
    try:
        # Validate input
        if not images:
            raise HTTPException(status_code=400, detail="At least one image is required")
        
        if len(images) < 3:
            raise HTTPException(status_code=400, detail="At least 3 images are recommended for reliable recognition")
        
        # Save uploaded images to temporary files
        for image in images:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            content = await image.read()
            temp_file.write(content)
            temp_file.close()
            temp_paths.append(temp_file.name)
        
        # Register student using face service
        result = face_service.register_student(name, student_id, temp_paths)
        
        # Cleanup temporary files
        for path in temp_paths:
            if os.path.exists(path):
                os.unlink(path)
        
        if result["success"]:
            return JSONResponse(
                status_code=201,
                content={
                    "success": True,
                    "message": result["message"],
                    "student_id": result["student_id"],
                    "name": result["name"],
                    "summary": {
                        "total_images": result["total_images"],
                        "successful_embeddings": result["successful_embeddings"],
                        "failed_images": result.get("failed_images", [])
                    }
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        for path in temp_paths:
            if os.path.exists(path):
                os.unlink(path)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/attendance")
async def mark_attendance(
    image: UploadFile = File(..., description="Single face image for attendance"),
    timestamp: Optional[str] = Form(None, description="Optional custom timestamp (ISO format)")
):
    """
    Mark attendance by verifying face against registered students.
    
    Expo Go Usage:
    ```javascript
    const formData = new FormData();
    formData.append('image', {
      uri: capturedImage.uri,  // From camera
      type: 'image/jpeg',
      name: 'attendance.jpg'
    });
    formData.append('timestamp', new Date().toISOString());
    
    const response = await fetch('http://your-server:8000/attendance', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    if (result.attendance_marked) {
      console.log(`Attendance marked for ${result.student.name}`);
    } else {
      console.log('No match found');
    }
    ```
    """
    temp_path = None
    try:
        # Validate image
        if not image.content_type.startswith('image/'): # type: ignore
            raise HTTPException(status_code=400, detail="Uploaded file must be an image")
        
        # Save uploaded image to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        content = await image.read()
        temp_file.write(content)
        temp_file.close()
        temp_path = temp_file.name
        
        # Use current timestamp if not provided
        if not timestamp:
            timestamp = datetime.now().isoformat()
        
        # Mark attendance using face service
        result = face_service.mark_attendance(temp_path, timestamp)
        
        # Cleanup temporary file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        if result["success"]:
            if result["attendance_marked"]:
                return {
                    "success": True,
                    "attendance_marked": True,
                    "student": result["student"],
                    "confidence": round(result["confidence"], 4),
                    "attendance_id": result["attendance_id"],
                    "timestamp": timestamp,
                    "message": result["message"]
                }
            else:
                return {
                    "success": True,
                    "attendance_marked": False,
                    "best_match": result.get("best_match"),
                    "confidence": round(result.get("confidence", 0), 4),
                    "all_matches": result.get("all_matches", []),
                    "message": result["message"]
                }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Attendance marking failed: {str(e)}")

@app.get("/students")
async def get_all_students():
    """
    Get list of all registered students.
    
    Expo Go Usage:
    ```javascript
    const response = await fetch('http://your-server:8000/students');
    const students = await response.json();
    ```
    """
    try:
        students = db.get_all_students()
        return {
            "success": True,
            "count": len(students),
            "students": [
                {
                    "id": student["id"],
                    "name": student["name"],
                    "student_id": student["student_id"],
                    "image_count": student["image_count"],
                    "is_active": student["is_active"]
                }
                for student in students
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch students: {str(e)}")

@app.get("/attendance/{date}")
async def get_attendance_by_date(date: str):
    """
    Get attendance records for a specific date (YYYY-MM-DD format).
    
    Expo Go Usage:
    ```javascript
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const response = await fetch(`http://your-server:8000/attendance/${today}`);
    const records = await response.json();
    ```
    """
    try:
        records = db.get_attendance_by_date(date)
        return {
            "success": True,
            "date": date,
            "count": len(records),
            "attendance": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch attendance: {str(e)}")

@app.get("/stats")
async def get_system_stats():
    """Get system statistics and health information."""
    try:
        stats = face_service.get_system_stats()
        if stats["success"]:
            return {
                "success": True,
                "stats": {
                    "total_students": stats["total_students"],
                    "total_embeddings": stats["total_embeddings"],
                    "model_name": stats["model_name"],
                    "confidence_threshold": stats["confidence_threshold"],
                    "average_embeddings_per_student": stats["average_embeddings_per_student"]
                }
            }
        else:
            raise HTTPException(status_code=500, detail=stats["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.post("/improve-recognition")
async def improve_recognition(
    student_id: str = Form(..., description="Student ID to improve"),
    images: List[UploadFile] = File(..., description="Additional face images")
):
    """
    Add more training images to improve recognition for existing student.
    
    Expo Go Usage:
    ```javascript
    // Similar to /register but for existing student
    const formData = new FormData();
    formData.append('student_id', 'existing_student_id');
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `improve_${index}.jpg`
      });
    });
    
    const response = await fetch('http://your-server:8000/improve-recognition', {
      method: 'POST',
      body: formData,
    });
    ```
    """
    temp_paths = []
    try:
        # Save uploaded images to temporary files
        for image in images:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            content = await image.read()
            temp_file.write(content)
            temp_file.close()
            temp_paths.append(temp_file.name)
        
        # Generate embeddings for new images
        new_embeddings = []
        failed_images = []
        
        for image_path in temp_paths:
            try:
                embedding = face_service.generate_embedding(image_path)
                new_embeddings.append(embedding)
            except Exception as e:
                failed_images.append({"path": image_path, "error": str(e)})
        
        # Update student embeddings in database
        if new_embeddings:
            success = db.update_student_embeddings(student_id, new_embeddings, temp_paths)
            
            # Cleanup
            for path in temp_paths:
                if os.path.exists(path):
                    os.unlink(path)
            
            if success:
                return {
                    "success": True,
                    "message": f"Added {len(new_embeddings)} new embeddings for student {student_id}",
                    "added_embeddings": len(new_embeddings),
                    "failed_images": failed_images
                }
            else:
                raise HTTPException(status_code=404, detail="Student not found")
        else:
            raise HTTPException(status_code=400, detail="No valid embeddings generated from provided images")
            
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        for path in temp_paths:
            if os.path.exists(path):
                os.unlink(path)
        raise HTTPException(status_code=500, detail=f"Recognition improvement failed: {str(e)}")

# Error handlers
@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": "Endpoint not found"}
    )

if __name__ == "__main__":
    print("🚀 Starting Face Recognition Attendance API Server...")
    print("📱 Expo Go can connect to: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,  # Change this line
        host="0.0.0.0",
        port=8000,
        reload=False
    )
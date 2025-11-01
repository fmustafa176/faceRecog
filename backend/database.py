# database.py
"""
MongoDB database operations for face recognition attendance system.
This handles all database interactions for students, embeddings, and attendance.

Expo Go Connection:
- Your frontend will interact with this through the API endpoints in app.py
- No direct connection from Expo Go to this file
"""

import pymongo
from pymongo import MongoClient
import numpy as np
from bson.binary import Binary
import pickle
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import os

load_dotenv()
mongo_url = os.getenv("MONGO_URL")


class MongoDB:
    def __init__(self, connection_string: str = None, db_name: str = "attendance_system"): # type: ignore
        """
        Initialize MongoDB connection.
        
        Expo Go Note: 
        - Change connection_string to your MongoDB Atlas URL for production
        - For local development, use "mongodb://localhost:27017/"
        """
        if connection_string is None:
            connection_string = mongo_url
        self.client = MongoClient(connection_string)
        self.db = self.client[db_name]
        self.students = self.db.students
        self.attendance = self.db.attendance
        
        # Create indexes for better performance
        self.students.create_index("student_id", unique=True)
        self.attendance.create_index([("student_id", 1), ("date", 1)])
    
    def add_student(self, name: str, student_id: str, embeddings: List[np.ndarray], image_paths: List[str] = None) -> str: # type: ignore
        """
        Add a new student with their face embeddings.
        
        Expo Go Connection:
        - This will be called when registering new students via the /register endpoint
        - embeddings are generated from multiple face images
        """
        student_data = {
            "name": name,
            "student_id": student_id,
            "embeddings": [Binary(pickle.dumps(emb, protocol=2)) for emb in embeddings],
            "image_count": len(embeddings),
            "image_paths": image_paths or [],
            "is_active": True,
            "created_at": None  # Will be set to current timestamp by MongoDB
        }
        
        result = self.students.insert_one(student_data)
        return str(result.inserted_id)
    
    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Get student data by student ID."""
        student = self.students.find_one({"student_id": student_id})
        if student:
            return self._deserialize_student(student)
        return None
    
    def get_all_students(self) -> List[Dict[str, Any]]:
        """
        Get all active students with their embeddings.
        
        Expo Go Connection:
        - Used by face_service.py to compare against all registered students
        - Returns list of all students for attendance marking
        """
        students = self.students.find({"is_active": True})
        return [self._deserialize_student(student) for student in students]
    
    def get_all_embeddings(self) -> List[Dict[str, Any]]:
        """
        Get all students with their embeddings for face comparison.
        
        Expo Go Connection:
        - Critical for face recognition during attendance marking
        - Returns all embeddings in a format easy for comparison
        """
        students_data = []
        for student in self.students.find({"is_active": True}):
            student_data = self._deserialize_student(student)
            students_data.append({
                "student_id": student_data["student_id"],
                "name": student_data["name"],
                "embeddings": student_data["embeddings"]
            })
        return students_data
    
    def _deserialize_student(self, student: Dict) -> Dict[str, Any]:
        """Convert MongoDB document to Python-friendly format."""
        if 'embeddings' in student and student['embeddings']:
            embeddings = [pickle.loads(emb) for emb in student['embeddings']]
        else:
            embeddings = []
            
        return {
            "id": str(student["_id"]),
            "name": student["name"],
            "student_id": student["student_id"],
            "embeddings": embeddings,
            "image_count": student.get("image_count", 0),
            "image_paths": student.get("image_paths", []),
            "is_active": student.get("is_active", True),
            "created_at": student.get("created_at")
        }
    
    def record_attendance(self, student_id: str, check_in_time: str = None, image_path: str = None) -> str: # type: ignore
        """
        Record attendance for a student.
        
        Expo Go Connection:
        - Called when face recognition successfully identifies a student
        - check_in_time can be sent from frontend or generated on server
        - image_path can store the attendance image for verification
        """
        attendance_record = {
            "student_id": student_id,
            "check_in": check_in_time,  # Should be ISO format string
            "date": check_in_time.split('T')[0] if check_in_time else None,  # Extract date part
            "image_path": image_path,
            "verified": True
        }
        
        result = self.attendance.insert_one(attendance_record)
        return str(result.inserted_id)
    
    def get_attendance_by_date(self, date: str) -> List[Dict[str, Any]]:
        """
        Get attendance records for a specific date.
        
        Expo Go Connection:
        - Useful for displaying attendance reports in your app
        - Date format: "YYYY-MM-DD"
        """
        records = self.attendance.find({"date": date})
        return [{
            "id": str(record["_id"]),
            "student_id": record["student_id"],
            "check_in": record["check_in"],
            "image_path": record.get("image_path")
        } for record in records]
    
    def update_student_embeddings(self, student_id: str, new_embeddings: List[np.ndarray], new_image_paths: List[str] = None) -> bool: # type: ignore
        """
        Update or add more embeddings for an existing student.
        
        Expo Go Connection:
        - Useful for improving recognition accuracy by adding more training images
        - Can be called from an "improve recognition" feature in your app
        """
        current_student = self.students.find_one({"student_id": student_id})
        if not current_student:
            return False
        
        # Combine existing and new embeddings
        current_embeddings = [pickle.loads(emb) for emb in current_student.get('embeddings', [])]
        all_embeddings = current_embeddings + new_embeddings
        
        current_paths = current_student.get('image_paths', [])
        all_paths = current_paths + (new_image_paths or [])
        
        update_data = {
            "embeddings": [Binary(pickle.dumps(emb, protocol=2)) for emb in all_embeddings],
            "image_count": len(all_embeddings),
            "image_paths": all_paths
        }
        
        result = self.students.update_one(
            {"student_id": student_id},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    def delete_student(self, student_id: str) -> bool:
        """Soft delete a student by setting is_active to False."""
        result = self.students.update_one(
            {"student_id": student_id},
            {"$set": {"is_active": False}}
        )
        return result.modified_count > 0
    
    def close_connection(self):
        """Close MongoDB connection."""
        self.client.close()


db = MongoDB()
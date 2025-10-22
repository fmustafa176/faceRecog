# face_service.py
"""
Face recognition service using DeepFace for generating and comparing face embeddings.
This handles the core face recognition logic for both registration and attendance.

Expo Go Connection:
- Your frontend will send images to API endpoints which call these functions
- No direct connection from Expo Go to this file
"""

from deepface import DeepFace
import numpy as np
import os
from typing import List, Dict, Any, Tuple, Optional
from database import MongoDB
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceService:
    def __init__(self, db: MongoDB = None, model_name: str = "Facenet"): # type: ignore
        """
        Initialize face recognition service.
        
        Expo Go Note:
        - model_name can be "Facenet", "VGG-Face", "OpenFace", "DeepID", "ArcFace", "Dlib"
        - Facenet is recommended for good balance of accuracy and speed
        """
        self.db = db or MongoDB()
        self.model_name = model_name
        self.detector_backend = "opencv"  # Alternatives: "mtcnn", "retinaface", "ssd"
        self.confidence_threshold = 0.6  # Adjust based on your accuracy needs
        
        logger.info(f"FaceService initialized with model: {model_name}")
    
    def generate_embedding(self, image_path: str) -> np.ndarray:
        """
        Generate face embedding from a single image.
        
        Expo Go Connection:
        - This is called for each image during student registration
        - Also called for the single image during attendance marking
        """
        try:
            # Verify image exists
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")
            
            # Generate embedding using DeepFace
            embedding_objs = DeepFace.represent(
                img_path=image_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=True
            )
            
            if embedding_objs:
                # Convert to numpy array
                embedding = np.array(embedding_objs[0]['embedding'], dtype=np.float64) #type: ignore
                logger.info(f"Successfully generated embedding from {image_path}")
                return embedding
            else:
                raise Exception("No face detected in the image")
                
        except Exception as e:
            logger.error(f"Error generating embedding for {image_path}: {str(e)}")
            raise
    
    def register_student(self, name: str, student_id: str, image_paths: List[str]) -> Dict[str, Any]:
        """
        Register a new student with multiple face images.
        
        Expo Go Connection:
        - Your frontend should capture 10-20 images and send them to /register endpoint
        - This processes all images and stores embeddings in database
        """
        try:
            # Validate inputs
            if not name or not student_id:
                return {"success": False, "error": "Name and student ID are required"}
            
            if not image_paths:
                return {"success": False, "error": "At least one image is required"}
            
            # Check if student already exists
            existing_student = self.db.get_student_by_id(student_id)
            if existing_student:
                return {"success": False, "error": f"Student ID {student_id} already exists"}
            
            successful_embeddings = []
            failed_images = []
            
            # Process each image to generate embeddings
            for i, image_path in enumerate(image_paths):
                try:
                    embedding = self.generate_embedding(image_path)
                    successful_embeddings.append(embedding)
                    logger.info(f"Processed image {i+1}/{len(image_paths)} successfully")
                    
                except Exception as e:
                    failed_images.append({
                        'path': image_path,
                        'error': str(e)
                    })
                    logger.warning(f"Failed to process image {i+1}: {str(e)}")
            
            # Check if we have enough successful embeddings
            if len(successful_embeddings) < 3:  # Minimum 3 images for reliable recognition
                return {
                    "success": False, 
                    "error": f"Only {len(successful_embeddings)} images processed successfully. Need at least 3.",
                    "failed_images": failed_images
                }
            
            # Store student data in database
            student_db_id = self.db.add_student(
                name=name,
                student_id=student_id,
                embeddings=successful_embeddings,
                image_paths=image_paths
            )
            
            return {
                "success": True,
                "student_id": student_id,
                "name": name,
                "db_id": student_db_id,
                "total_images": len(image_paths),
                "successful_embeddings": len(successful_embeddings),
                "failed_images": failed_images,
                "message": f"Student registered with {len(successful_embeddings)} face embeddings"
            }
            
        except Exception as e:
            logger.error(f"Error registering student {student_id}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def verify_face(self, image_path: str) -> Dict[str, Any]:
        """
        Verify a face against all registered students.
        
        Expo Go Connection:
        - This is called when marking attendance via /attendance endpoint
        - Takes one image and compares against all stored embeddings
        """
        try:
            # Generate embedding for the input image
            input_embedding = self.generate_embedding(image_path)
            
            # Get all registered students with their embeddings
            all_students = self.db.get_all_embeddings()
            
            if not all_students:
                return {
                    "success": True,
                    "matched": False,
                    "error": "No students registered in the system"
                }
            
            best_match = None
            best_distance = float('inf')
            all_distances = []
            
            # Compare with all registered students
            for student in all_students:
                student_distances = []
                
                # Compare with each embedding of the student
                for stored_embedding in student['embeddings']:
                    distance = self.cosine_distance(input_embedding, stored_embedding)
                    student_distances.append(distance)
                
                # Use the best (minimum) distance for this student
                min_student_distance = min(student_distances)
                all_distances.append({
                    'student_id': student['student_id'],
                    'name': student['name'],
                    'distance': min_student_distance
                })
                
                if min_student_distance < best_distance:
                    best_distance = min_student_distance
                    best_match = {
                        'student_id': student['student_id'],
                        'name': student['name'],
                        'distance': min_student_distance
                    }
            
            # Calculate confidence (inverse of distance)
            confidence = 1 - best_distance
            
            # Check if best match meets confidence threshold
            if best_match and best_distance <= self.confidence_threshold:
                return {
                    "success": True,
                    "matched": True,
                    "student": best_match,
                    "confidence": confidence,
                    "distance": best_distance,
                    "all_matches": sorted(all_distances, key=lambda x: x['distance'])[:5]  # Top 5 matches
                }
            else:
                return {
                    "success": True,
                    "matched": False,
                    "best_match": best_match,
                    "confidence": confidence,
                    "distance": best_distance,
                    "all_matches": sorted(all_distances, key=lambda x: x['distance'])[:5],
                    "message": "No confident match found"
                }
                
        except Exception as e:
            logger.error(f"Error verifying face: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def mark_attendance(self, image_path: str, timestamp: str = None) -> Dict[str, Any]: #type: ignore
        """
        Mark attendance by verifying face and recording in database.
        
        Expo Go Connection:
        - This is the main function called by your /attendance endpoint
        - Returns detailed result for frontend display
        """
        try:
            # Verify the face
            verification_result = self.verify_face(image_path)
            
            if not verification_result['success']:
                return verification_result
            
            if verification_result['matched']:
                student_id = verification_result['student']['student_id']
                student_name = verification_result['student']['name']
                confidence = verification_result['confidence']
                
                # Record attendance in database
                attendance_id = self.db.record_attendance(
                    student_id=student_id,
                    check_in_time=timestamp,
                    image_path=image_path
                )
                
                return {
                    "success": True,
                    "attendance_marked": True,
                    "attendance_id": attendance_id,
                    "student": {
                        "student_id": student_id,
                        "name": student_name
                    },
                    "confidence": confidence,
                    "message": f"Attendance marked for {student_name}"
                }
            else:
                return {
                    "success": True,
                    "attendance_marked": False,
                    "best_match": verification_result.get('best_match'),
                    "confidence": verification_result.get('confidence'),
                    "all_matches": verification_result.get('all_matches', []),
                    "message": "No matching student found with sufficient confidence"
                }
                
        except Exception as e:
            logger.error(f"Error marking attendance: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def cosine_distance(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Calculate cosine distance between two embeddings.
        Lower distance = more similar faces.
        """
        return 1 - np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    def get_system_stats(self) -> Dict[str, Any]:
        """
        Get system statistics for monitoring.
        
        Expo Go Connection:
        - Can be called from an admin dashboard in your app
        """
        try:
            all_students = self.db.get_all_students()
            total_students = len(all_students)
            total_embeddings = sum(student['image_count'] for student in all_students)
            
            return {
                "success": True,
                "total_students": total_students,
                "total_embeddings": total_embeddings,
                "model_name": self.model_name,
                "confidence_threshold": self.confidence_threshold,
                "average_embeddings_per_student": total_embeddings / total_students if total_students > 0 else 0
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Global instance for easy import
face_service = FaceService()
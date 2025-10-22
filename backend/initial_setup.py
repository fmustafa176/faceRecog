# initial_setup.py
"""
One-time script to load pre-labeled students from the 'students' directory.
This will read all student folders, generate embeddings, and store in MongoDB.

Expo Go Connection:
- This is a ONE-TIME script only, not used by your frontend
- Run this once manually to pre-load your initial students
- After this, use the /register endpoint in app.py for new students
"""

import os
import glob
from database import MongoDB
from face_service import FaceService
import logging
from typing import List, Dict, Any

# Set up logging to see progress
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InitialSetup:
    def __init__(self):
        self.db = MongoDB()
        self.face_service = FaceService(self.db)
        self.students_dir = "students"  # Change this if your directory is elsewhere
        
    def discover_students(self) -> List[Dict[str, Any]]:
        """
        Discover all student folders in the students directory.
        Expected structure:
        students/
        ├── Student1/
        │   ├── random123.jpg
        │   ├── abc456.jpg
        │   └── ...
        ├── Student2/
        └── ...
        """
        students_data = []
        
        if not os.path.exists(self.students_dir):
            logger.error(f"Students directory '{self.students_dir}' not found!")
            return students_data
        
        # Find all subdirectories in students folder
        student_folders = [f for f in os.listdir(self.students_dir) 
                          if os.path.isdir(os.path.join(self.students_dir, f))]
        
        if not student_folders:
            logger.error(f"No student folders found in '{self.students_dir}'")
            return students_data
        
        logger.info(f"Found {len(student_folders)} student folders: {student_folders}")
        
        for folder in student_folders:
            folder_path = os.path.join(self.students_dir, folder)
            
            # Extract student name and ID from folder name
            # Assuming folder names like "Student1", "Student2", etc.
            student_name = folder.replace('_', ' ')  # Convert underscores to spaces
            student_id = folder.lower().replace(' ', '_')  # Create ID from name
            
            # Find all image files in the folder
            image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
            image_paths = []
            
            for extension in image_extensions:
                image_paths.extend(glob.glob(os.path.join(folder_path, extension)))
            
            if not image_paths:
                logger.warning(f"No images found in {folder_path}")
                continue
            
            logger.info(f"Found {len(image_paths)} images for {student_name}")
            
            students_data.append({
                'name': student_name,
                'student_id': student_id,
                'folder_path': folder_path,
                'image_paths': image_paths
            })
        
        return students_data
    
    def register_student_batch(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a single student with all their images.
        """
        try:
            logger.info(f"Registering {student_data['name']} with {len(student_data['image_paths'])} images...")
            
            # Use the face service to register the student
            result = self.face_service.register_student(
                name=student_data['name'],
                student_id=student_data['student_id'],
                image_paths=student_data['image_paths']
            )
            
            if result['success']:
                logger.info(f"✅ SUCCESS: {student_data['name']} registered with {result['successful_embeddings']} embeddings")
                if result['failed_images']:
                    logger.warning(f"   {len(result['failed_images'])} images failed for {student_data['name']}")
            else:
                logger.error(f"❌ FAILED: {student_data['name']} - {result['error']}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ ERROR registering {student_data['name']}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def run_initial_setup(self):
        """
        Main function to run the initial setup.
        This will process all students in the directory and register them.
        """
        logger.info("🚀 Starting initial student setup...")
        logger.info(f"Looking for students in: {os.path.abspath(self.students_dir)}")
        
        # Discover all students and their images
        students_data = self.discover_students()
        
        if not students_data:
            logger.error("No students found to register!")
            return
        
        logger.info(f"📚 Found {len(students_data)} students to register")
        
        total_success = 0
        total_failed = 0
        results = []
        
        # Process each student
        for student_data in students_data:
            result = self.register_student_batch(student_data)
            results.append(result)
            
            if result['success']:
                total_success += 1
            else:
                total_failed += 1
        
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("📊 SETUP SUMMARY")
        logger.info("="*50)
        logger.info(f"✅ Successfully registered: {total_success} students")
        logger.info(f"❌ Failed to register: {total_failed} students")
        logger.info(f"📁 Total processed: {len(students_data)} students")
        
        # Show system stats
        stats = self.face_service.get_system_stats()
        if stats['success']:
            logger.info(f"👥 Total students in database: {stats['total_students']}")
            logger.info(f"🖼️ Total embeddings stored: {stats['total_embeddings']}")
            logger.info(f"📈 Average embeddings per student: {stats['average_embeddings_per_student']:.1f}")
        
        logger.info("🎉 Initial setup completed!")
        
        return results

def main():
    """
    Main function to run when this script is executed directly.
    """
    print("="*60)
    print("INITIAL STUDENT SETUP SCRIPT")
    print("="*60)
    print("This script will:")
    print("1. Scan the 'students' directory for student folders")
    print("2. Process all images in each folder")
    print("3. Generate face embeddings using DeepFace")
    print("4. Store students and embeddings in MongoDB")
    print("="*60)
    
    confirm = input("Do you want to continue? (yes/no): ").strip().lower()
    
    if confirm in ['yes', 'y']:
        setup = InitialSetup()
        setup.run_initial_setup()
    else:
        print("Setup cancelled.")


if __name__ == "__main__":
    # Expo Go Note: 
    # This script is for ONE-TIME use only to load your initial students
    # Run this from command line: python initial_setup.py
    # Make sure your MongoDB is running and 'students' directory exists
    
    main()
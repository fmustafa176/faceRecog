# cli.py
"""
Command-line interface for admin tasks and testing.
This is for manual administration, not used by Expo Go frontend.

Expo Go Connection:
- This is for ADMIN USE only, not connected to your mobile app
- Use this for testing, debugging, and manual database operations
"""

import argparse
import sys
from datetime import datetime, date
from database import MongoDB
from face_service import FaceService

class AttendanceCLI:
    def __init__(self):
        self.db = MongoDB()
        self.face_service = FaceService(self.db)
    
    def show_stats(self):
        """Display system statistics"""
        print("\n📊 SYSTEM STATISTICS")
        print("=" * 40)
        
        stats = self.face_service.get_system_stats()
        if stats["success"]:
            print(f"Total Students: {stats['total_students']}")
            print(f"Total Embeddings: {stats['total_embeddings']}")
            print(f"Model: {stats['model_name']}")
            print(f"Confidence Threshold: {stats['confidence_threshold']}")
            print(f"Avg Embeddings/Student: {stats['average_embeddings_per_student']:.1f}")
        else:
            print(f"Error: {stats['error']}")
    
    def list_students(self):
        """List all registered students"""
        print("\n👥 REGISTERED STUDENTS")
        print("=" * 50)
        
        students = self.db.get_all_students()
        if not students:
            print("No students found in database.")
            return
        
        for i, student in enumerate(students, 1):
            print(f"{i:2d}. {student['name']} (ID: {student['student_id']})")
            print(f"     Embeddings: {student['image_count']}, Active: {student['is_active']}")
            if student.get('image_paths'):
                print(f"     Sample images: {len(student['image_paths'])}")
            print()
    
    def show_attendance(self, target_date=None):
        """Show attendance records for a date"""
        if not target_date:
            target_date = date.today().isoformat()
        
        print(f"\n📅 ATTENDANCE FOR {target_date}")
        print("=" * 50)
        
        records = self.db.get_attendance_by_date(target_date)
        if not records:
            print(f"No attendance records found for {target_date}")
            return
        
        for i, record in enumerate(records, 1):
            student = self.db.get_student_by_id(record['student_id'])
            student_name = student['name'] if student else "Unknown Student"
            print(f"{i:2d}. {student_name} (ID: {record['student_id']})")
            print(f"     Check-in: {record['check_in']}")
            if record.get('image_path'):
                print(f"     Image: {record['image_path']}")
            print()
    
    def test_face_recognition(self, image_path):
        """Test face recognition with a single image"""
        print(f"\n🧪 TESTING FACE RECOGNITION")
        print("=" * 40)
        print(f"Image: {image_path}")
        
        if not os.path.exists(image_path):
            print("❌ Error: Image file not found")
            return
        
        result = self.face_service.verify_face(image_path)
        
        if result["success"]:
            if result["matched"]:
                print("✅ MATCH FOUND!")
                print(f"   Student: {result['student']['name']}")
                print(f"   ID: {result['student']['student_id']}")
                print(f"   Confidence: {result['confidence']:.2%}")
                print(f"   Distance: {result['distance']:.4f}")
            else:
                print("❌ NO CONFIDENT MATCH FOUND")
                if result.get('best_match'):
                    print(f"   Closest match: {result['best_match']['name']}")
                    print(f"   Distance: {result['best_match']['distance']:.4f}")
                print(f"   Confidence: {result['confidence']:.2%}")
            
            # Show top 5 matches
            if result.get('all_matches'):
                print("\n🏆 TOP 5 MATCHES:")
                for i, match in enumerate(result['all_matches'][:5], 1):
                    status = "✅" if i == 1 and result['matched'] else "  "
                    print(f"   {status} {i}. {match['name']} (ID: {match['student_id']}) - Distance: {match['distance']:.4f}")
        else:
            print(f"❌ Error: {result['error']}")
    
    def delete_student(self, student_id):
        """Soft delete a student"""
        print(f"\n🗑️  DELETING STUDENT: {student_id}")
        print("=" * 40)
        
        student = self.db.get_student_by_id(student_id)
        if not student:
            print("❌ Error: Student not found")
            return
        
        print(f"Student: {student['name']} (ID: {student['student_id']})")
        print(f"Embeddings: {student['image_count']}")
        
        confirm = input("Are you sure you want to disable this student? (yes/no): ").strip().lower()
        if confirm in ['yes', 'y']:
            success = self.db.delete_student(student_id)
            if success:
                print("✅ Student disabled successfully")
            else:
                print("❌ Failed to disable student")
        else:
            print("❌ Deletion cancelled")
    
    def show_student_detail(self, student_id):
        """Show detailed information about a student"""
        print(f"\n👤 STUDENT DETAILS: {student_id}")
        print("=" * 40)
        
        student = self.db.get_student_by_id(student_id)
        if not student:
            print("❌ Error: Student not found")
            return
        
        print(f"Name: {student['name']}")
        print(f"Student ID: {student['student_id']}")
        print(f"Embeddings: {student['image_count']}")
        print(f"Active: {student['is_active']}")
        print(f"Database ID: {student['id']}")
        
        if student.get('image_paths'):
            print(f"\n📷 Image Paths ({len(student['image_paths'])}):")
            for i, path in enumerate(student['image_paths'][:5], 1):  # Show first 5
                print(f"   {i}. {path}")
            if len(student['image_paths']) > 5:
                print(f"   ... and {len(student['image_paths']) - 5} more")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Attendance System CLI")
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Stats command
    subparsers.add_parser('stats', help='Show system statistics')
    
    # List students command
    subparsers.add_parser('students', help='List all registered students')
    
    # Attendance command
    attendance_parser = subparsers.add_parser('attendance', help='Show attendance records')
    attendance_parser.add_argument('--date', help='Date in YYYY-MM-DD format (default: today)')
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Test face recognition')
    test_parser.add_argument('image_path', help='Path to test image')
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a student')
    delete_parser.add_argument('student_id', help='Student ID to delete')
    
    # Student detail command
    detail_parser = subparsers.add_parser('student', help='Show student details')
    detail_parser.add_argument('student_id', help='Student ID to show')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = AttendanceCLI()
    
    try:
        if args.command == 'stats':
            cli.show_stats()
        elif args.command == 'students':
            cli.list_students()
        elif args.command == 'attendance':
            cli.show_attendance(args.date)
        elif args.command == 'test':
            cli.test_face_recognition(args.image_path)
        elif args.command == 'delete':
            cli.delete_student(args.student_id)
        elif args.command == 'student':
            cli.show_student_detail(args.student_id)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Expo Go Connection Note:
    # This file is for ADMIN use only, not used by your mobile app
    # Use this for testing and manual database operations
    
    print("🎯 Attendance System CLI")
    print("   Use this for admin tasks and testing\n")
    
    # Import here to avoid dependency if not using CLI
    import os
    from database import MongoDB
    from face_service import FaceService
    
    main()
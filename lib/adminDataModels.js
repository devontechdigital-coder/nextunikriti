import Assignment from '@/models/Assignment';
import Attendance from '@/models/Attendance';
import Banner from '@/models/Banner';
import Batch from '@/models/Batch';
import BatchCourse from '@/models/BatchCourse';
import BatchStudent from '@/models/BatchStudent';
import Bookmark from '@/models/Bookmark';
import Category from '@/models/Category';
import Certificate from '@/models/Certificate';
import ClassProgress from '@/models/ClassProgress';
import ClassSession from '@/models/ClassSession';
import Counter from '@/models/Counter';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
import CourseMapping from '@/models/CourseMapping';
import Enquiry from '@/models/Enquiry';
import Enrollment from '@/models/Enrollment';
import InstructorProfile from '@/models/InstructorProfile';
import Instrument from '@/models/Instrument';
import Lesson from '@/models/Lesson';
import Level from '@/models/Level';
import Menu from '@/models/Menu';
import Mode from '@/models/Mode';
import PackageModel from '@/models/Package';
import Page from '@/models/Page';
import Payment from '@/models/Payment';
import Payout from '@/models/Payout';
import Quiz from '@/models/Quiz';
import Review from '@/models/Review';
import School from '@/models/School';
import Section from '@/models/Section';
import Setting from '@/models/Setting';
import Student from '@/models/Student';
import StudentParent from '@/models/StudentParent';
import StudentProgress from '@/models/StudentProgress';
import Timetable from '@/models/Timetable';
import User from '@/models/User';

export const adminDataModels = [
  { key: 'Assignment', label: 'Assignments', model: Assignment },
  { key: 'Attendance', label: 'Attendance', model: Attendance },
  { key: 'Banner', label: 'Banners', model: Banner },
  { key: 'Batch', label: 'Batches', model: Batch },
  { key: 'BatchCourse', label: 'Batch Courses', model: BatchCourse },
  { key: 'BatchStudent', label: 'Batch Students', model: BatchStudent },
  { key: 'Bookmark', label: 'Bookmarks', model: Bookmark },
  { key: 'Category', label: 'Categories', model: Category },
  { key: 'Certificate', label: 'Certificates', model: Certificate },
  { key: 'ClassProgress', label: 'Class Progress', model: ClassProgress },
  { key: 'ClassSession', label: 'Class Sessions', model: ClassSession },
  { key: 'Counter', label: 'Counters', model: Counter },
  { key: 'Coupon', label: 'Coupons', model: Coupon },
  { key: 'Course', label: 'Courses', model: Course },
  { key: 'CourseMapping', label: 'Course Mappings', model: CourseMapping },
  { key: 'Enquiry', label: 'Enquiries', model: Enquiry },
  { key: 'Enrollment', label: 'Enrollments', model: Enrollment },
  { key: 'InstructorProfile', label: 'Instructor Profiles', model: InstructorProfile },
  { key: 'Instrument', label: 'Instruments', model: Instrument },
  { key: 'Lesson', label: 'Lessons', model: Lesson },
  { key: 'Level', label: 'Levels', model: Level },
  { key: 'Menu', label: 'Menus', model: Menu },
  { key: 'Mode', label: 'Modes', model: Mode },
  { key: 'Package', label: 'Packages', model: PackageModel },
  { key: 'Page', label: 'Pages', model: Page },
  { key: 'Payment', label: 'Payments', model: Payment },
  { key: 'Payout', label: 'Payouts', model: Payout },
  { key: 'Quiz', label: 'Quizzes', model: Quiz },
  { key: 'Review', label: 'Reviews', model: Review },
  { key: 'School', label: 'Schools', model: School },
  { key: 'Section', label: 'Sections', model: Section },
  { key: 'Setting', label: 'Settings', model: Setting },
  { key: 'Student', label: 'Students', model: Student },
  { key: 'StudentParent', label: 'Student Parents', model: StudentParent },
  { key: 'StudentProgress', label: 'Student Progress', model: StudentProgress },
  { key: 'Timetable', label: 'Timetables', model: Timetable },
  { key: 'User', label: 'Users', model: User },
];

export function getAdminDataModelMap() {
  return new Map(adminDataModels.map((entry) => [entry.key, entry]));
}

export function resolveAdminDataModels(modelKeys = []) {
  const modelMap = getAdminDataModelMap();
  const keys = modelKeys.includes('all') ? adminDataModels.map((entry) => entry.key) : modelKeys;

  return keys.map((key) => modelMap.get(key)).filter(Boolean);
}

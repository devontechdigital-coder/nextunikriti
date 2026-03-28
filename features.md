# Product Features Reference

This document summarizes the current feature set implemented in this codebase, based on the `app/`, `app/api/`, `models/`, and shared `components/` structure.

Its goal is to help future development by giving one place to understand:

- what the platform already supports
- which user roles exist
- which pages and APIs back each area
- which core entities power the product
- where extension points already exist

## 1. Product Overview

This project is a multi-role learning management platform built on Next.js App Router with MongoDB/Mongoose. It supports public course discovery, role-based dashboards, content delivery, learning progress, commerce, attendance, timetable management, and CMS-like configuration.

The product is not only a standard LMS. It also includes school-oriented operational features such as:

- batches
- class sessions
- attendance
- timetable management
- student parent data
- school-specific dashboards and management

At a high level, the platform currently supports these user areas:

- Public website
- Student portal
- Instructor portal
- School portal
- Admin portal

## 2. Main User Roles

The `User` model supports these roles:

- `student`
- `instructor`
- `admin`
- `school_admin`
- `parent`
- `staff`

In practice, the app currently has dedicated route groups for:

- public users
- students
- instructors
- school admins
- admins

## 3. Core Platform Capabilities

The platform already covers these main functional areas:

- course catalog and category-driven discovery
- public course detail pages
- login and OTP-based authentication flows
- role-based dashboards
- course creation and curriculum management
- reviews and ratings
- enrollments and payment flows
- package-based purchasing and optional batch/course assignment
- student progress tracking
- certificates and bookmarks
- instructor analytics and payout tracking
- school operations for students, instructors, batches, attendance, and timetable
- admin-level CMS, settings, gallery/media, menus, pages, banners, and global management

## 4. Core Data Models

The following models define the business domain of the application:

- `User`
- `Student`
- `StudentParent`
- `School`
- `Course`
- `Category`
- `Instrument`
- `Level`
- `Section`
- `Lesson`
- `Quiz`
- `Assignment`
- `Review`
- `Package`
- `Coupon`
- `Enrollment`
- `Payment`
- `Payout`
- `Certificate`
- `Bookmark`
- `Batch`
- `BatchCourse`
- `BatchStudent`
- `Timetable`
- `Attendance`
- `ClassSession`
- `ClassProgress`
- `StudentProgress`
- `Banner`
- `Menu`
- `Page`
- `Setting`
- `CourseMapping`

These models show that the product already supports both:

- consumer-style digital course selling
- operational classroom/school workflows

## 5. Public Website Features

Public-facing pages exist in `app/(public)`.

### 5.1 Homepage and Marketing

The public website includes:

- homepage
- contact page
- dynamic CMS pages
- global navigation/header/footer
- menu-driven content rendering
- banner-driven promotional content

Relevant routes:

- `/`
- `/contact`
- `/[slug]`

### 5.2 Course Discovery

Visitors can browse and discover learning content through:

- a course listing page
- category landing pages
- course detail pages
- SEO metadata on public detail pages

Relevant routes:

- `/courses`
- `/courses/[courseId]`
- `/categories/[slug]`

Existing discovery dimensions appear to include:

- category
- instrument
- level
- moderation/publish state
- creator/instructor attribution

### 5.3 Authentication

The public side includes login access and OTP-related auth APIs.

Relevant route:

- `/login`

Auth-related API coverage includes:

- login
- logout
- OTP send
- OTP verify
- profile update

## 6. Student Features

Student-facing pages exist in `app/(student)`.

### 6.1 Student Dashboard

Students have a dashboard for:

- viewing enrolled courses
- checking progress
- seeing learning-related status
- opening course-specific dashboards

Relevant routes:

- `/student/dashboard`
- `/student/dashboard/course/[courseId]`

### 6.2 Learning Experience

The student learning area supports:

- course consumption
- section and lesson navigation
- progress tracking
- lesson completion
- course view APIs
- protected lesson access

Relevant route:

- `/student/learning/[courseId]`

Related student APIs indicate support for:

- course view retrieval
- learning state
- progress updates
- enrollment data
- bookmarks
- certificates

### 6.3 Student Learning Utilities

Existing student API structure suggests support for:

- bookmarks for saved content
- certificates for completed learning outcomes
- detailed progress status
- enrollment listing

This gives a strong base for future additions such as:

- resume learning
- course completion summaries
- achievement history
- downloadable certificates UI improvements

## 7. Instructor Features

Instructor-facing pages exist in `app/(instructor)`.

### 7.1 Instructor Dashboard

The instructor dashboard likely includes:

- top-level KPIs
- course summary data
- student-related metrics
- revenue/earnings insights

Relevant route:

- `/instructor/dashboard`

### 7.2 Course Management

Instructors can manage their own courses through:

- course listing
- create/edit workflows
- curriculum management
- section ordering
- lesson management

Relevant routes:

- `/instructor/courses`
- `/instructor/courses/[courseId]`
- `/instructor/courses/[courseId]/curriculum`

Related APIs confirm support for:

- section CRUD
- section reorder
- lesson-level updates through section/course relationships

### 7.3 Student and Teaching Management

Instructor routes show support for:

- student listing
- timetable view
- attendance management
- classroom/session view

Relevant routes:

- `/instructor/students`
- `/instructor/timetable`
- `/instructor/attendance`
- `/instructor/classroom/[sessionId]`

This indicates the platform supports instructors beyond content authoring and into actual teaching operations.

### 7.4 Earnings and Analytics

Instructors have dedicated pages and APIs for:

- analytics
- earnings
- payout requests / payout history

Relevant routes:

- `/instructor/analytics`
- `/instructor/earnings`

Related APIs:

- `/api/instructor/analytics`
- `/api/instructor/earnings`
- `/api/instructor/payouts`

## 8. School Admin Features

School-facing pages exist in `app/(school)`.

This is one of the strongest differentiators of the product because it extends the LMS into operational school management.

### 8.1 School Dashboard

The school dashboard likely aggregates:

- student counts
- instructor counts
- batch status
- operational teaching metrics

Relevant route:

- `/school/dashboard`

### 8.2 Student Management

School admins can manage students through:

- student listing
- student detail page
- parent data workflows
- school-specific student administration

Relevant routes:

- `/school/students`
- `/school/students/[id]`

### 8.3 Instructor Management

School admins can manage instructors through:

- instructor listing
- instructor stats
- organization-level teaching oversight

Relevant route:

- `/school/instructors`

### 8.4 Batches

School admins can manage batches through:

- batch listing
- batch detail page
- course assignment to batch
- student assignment to batch

Relevant routes:

- `/school/batches`
- `/school/batches/[id]`

This suggests batch-based academic delivery is an important product pattern.

### 8.5 Timetable and Attendance

School operations include:

- timetable management
- attendance management

Relevant routes:

- `/school/timetable`
- `/school/attendance`

Combined with models such as `Timetable`, `Attendance`, `ClassSession`, and `Batch`, this is a substantial school operations module.

## 9. Admin Features

Admin-facing pages exist in `app/(admin)`.

The admin area is broad and acts as the control center of the platform.

### 9.1 Admin Dashboard and Analytics

Admins have access to:

- platform dashboard
- analytics view
- school-aware dashboard metrics

Relevant routes:

- `/admin`
- `/admin/dashboard`
- `/admin/analytics`

Related APIs:

- `/api/admin/dashboard`
- `/api/admin/dashboard/school`
- `/api/admin/analytics`

### 9.2 User and Role Management

Admins can manage:

- users
- students
- instructors
- schools

Relevant routes:

- `/admin/users`
- `/admin/students`
- `/admin/students/[id]`
- `/admin/instructors`
- `/admin/schools`

Likely capabilities include:

- create/update/delete users
- assign or inspect roles
- review status and activity
- manage student parent records
- school-level record administration

### 9.3 Course and Curriculum Governance

Admin course features include:

- course management
- curriculum management
- moderation-ready course workflows
- category/instrument/level mapping

Relevant routes:

- `/admin/courses`
- `/admin/courses/[id]/curriculum`
- `/admin/categories`
- `/admin/instruments`
- `/admin/instruments/[id]/levels`

Related APIs and models show support for:

- course moderation status
- category assignment
- instrument mapping
- level management
- section ordering

### 9.4 Operational Delivery

Admins also manage operational delivery features, including:

- timetable
- attendance
- batches
- class sessions

Relevant routes:

- `/admin/timetable`
- `/admin/attendance`
- `/admin/batches`
- `/admin/batches/[id]`

Related APIs show:

- attendance reporting
- class session lesson completion
- batch-course assignment
- batch-student assignment

### 9.5 Commerce and Monetization

The admin panel includes commerce-related management for:

- orders
- payments
- packages
- coupons

Relevant routes:

- `/admin/orders`
- `/admin/payments`
- `/admin/packages`

Relevant APIs:

- `/api/orders`
- `/api/payments`
- `/api/payments/checkout`
- `/api/payments/verify`
- `/api/coupons`
- `/api/packages`

This indicates the platform already supports paid access flows and purchasable plans/packages.

### 9.6 CMS and Website Management

Admins can manage the public website through:

- banners
- menus
- pages
- gallery/media
- settings

Relevant routes:

- `/admin/banners`
- `/admin/menus`
- `/admin/pages`
- `/admin/gallery`
- `/admin/settings`

Related APIs confirm support for:

- banner CRUD
- menu CRUD and reorder
- page CRUD
- gallery upload/setup/folder/rename actions
- global settings and payment mode settings

This gives the project a CMS-style control layer, not just a teaching/admin back office.

## 10. Commerce, Enrollment, and Payments

The platform includes a clear transaction and enrollment system.

### 10.1 Enrollment Features

Supported capabilities appear to include:

- enrollment creation and management
- order creation
- student enrollment views
- purchase verification

Relevant APIs:

- `/api/enrollments`
- `/api/orders`
- `/api/student/enrollments`

### 10.2 Payments

Payment APIs indicate support for:

- payment record creation
- payment verification
- checkout initiation
- instructor payout tracking

Relevant APIs:

- `/api/payments`
- `/api/payments/checkout`
- `/api/payments/verify`
- `/api/instructor/payouts`

### 10.3 Packages and Coupons

The product also supports:

- packages/bundled offers
- coupon-based discounting

Relevant APIs:

- `/api/packages`
- `/api/coupons`

## 11. Content Structure and Delivery

The content model is organized in a standard hierarchy:

- Course
- Section
- Lesson
- Quiz
- Assignment

This is reinforced by the API structure:

- `/api/courses/[courseId]/sections`
- `/api/sections/[sectionId]`
- `/api/sections/[sectionId]/lessons`
- `/api/lessons/[lessonId]`
- `/api/lessons/[lessonId]/quiz`
- `/api/lessons/[lessonId]/assignment`
- `/api/quizs`
- `/api/assignments`

This gives a clean foundation for future development such as:

- richer content types
- lesson prerequisites
- graded submissions
- instructor feedback
- bulk curriculum imports

## 12. Progress, Reviews, and Certification

The platform already includes learning outcome features.

### 12.1 Progress Tracking

Supported APIs include:

- `/api/progress/[courseId]`
- `/api/progress/mark-complete`
- `/api/student/progress`

Models such as `StudentProgress` and `ClassProgress` show both:

- self-paced progress tracking
- classroom/session progress tracking

### 12.2 Reviews

Review functionality exists through:

- `/api/reviews`
- `/api/courses/[courseId]/reviews`

This suggests the public course detail pages can be extended further with richer social proof.

### 12.3 Certificates

Certificate support exists through:

- `/api/certificates`
- `/api/student/certificates`

This supports future work around graduation/completion experiences.

## 13. Media and Video Support

The codebase includes media and video endpoints:

- `/api/upload`
- `/api/videos/upload`
- `/api/videos/play`
- admin gallery APIs

This suggests support for:

- general file uploads
- video delivery
- centralized media browsing
- admin-managed asset organization

## 14. Routing and App Structure

The application uses route groups for role-based separation:

- `app/(public)`
- `app/(student)`
- `app/(instructor)`
- `app/(school)`
- `app/(admin)`

This is a solid structure for future expansion because:

- each role area can evolve independently
- layouts can enforce role-specific navigation
- middleware can be layered with route-specific access rules

## 15. Existing Shared UI and System Components

Important shared components currently include:

- `Navbar`
- `Header`
- `Footer`
- `AdminNavbar`
- `InstructorNavbar`
- `AttendanceManagement`
- `BatchSelector`
- `PackageSelector`
- `NavigationLoader`
- `ToasterProvider`

This indicates reusable UI patterns already exist for:

- marketing/public navigation
- admin/instructor shells
- commerce/package selection
- attendance workflows
- system notifications
- route transitions

## 16. Current API Coverage by Domain

The API surface is already broad.

### Admin domain

- analytics
- attendance
- banners
- batches
- categories
- class sessions
- courses
- dashboard
- gallery
- instructors
- instruments
- levels
- menus
- orders
- packages
- pages
- schools
- sections
- settings
- students
- timetable
- users

### Public/general domain

- analytics summary
- assignments
- auth
- batches
- categories
- certificates
- coupons
- courses
- enrollments
- instructors
- lessons
- my-courses
- orders
- packages
- pages
- payments
- progress
- quizs
- reviews
- sections
- settings
- uploads
- users
- videos

### Instructor domain

- analytics
- course section management
- earnings
- payouts
- sections
- students
- timetable

### Student domain

- bookmarks
- certificates
- course view
- enrollments
- learning
- progress

## 17. Strengths of the Current Product

The codebase already has a strong feature base in these areas:

- multi-role architecture
- real-world school operations support
- curriculum and content hierarchy
- payment and enrollment plumbing
- public website + CMS capabilities
- instructor earnings and analytics
- admin operational visibility
- extensible App Router structure

## 18. Gaps and Likely Future Development Areas

Based on the structure, these are good next-phase opportunities:

- stronger permission matrix across all roles
- parent-facing portal if the `parent` role is intended to become active
- staff-facing workflow pages if the `staff` role is intended to become active
- richer assessment grading and submission review
- notifications and messaging
- improved reporting exports
- audit logs for admin operations
- deeper payment reconciliation UI
- course moderation workflow UI enhancements
- school-level custom branding/settings
- student certificate and achievements UX
- improved search and filtering across catalog/admin areas
- batch/classroom live status views

## 19. Recommended Use of This Document

Use this file when:

- planning new features
- onboarding new developers
- deciding where a new module belongs
- identifying which role owns a workflow
- checking whether a feature already exists in some form

For implementation planning, combine this file with:

- `app/` for route ownership
- `app/api/` for backend capability
- `models/` for business entities
- shared components for reusable UI

## 20. Suggested Next Documentation Files

To continue improving maintainability, the next helpful docs would be:

- `architecture.md`
- `roles-and-permissions.md`
- `api-map.md`
- `data-models.md`
- `roadmap.md`

If maintained well, this project can evolve from a capable LMS into a full education operations platform with strong admin, teaching, school, and commerce workflows.

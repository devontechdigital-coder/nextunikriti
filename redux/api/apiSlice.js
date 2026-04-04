import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/utils/axiosBaseQuery';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: '/api' }),
  tagTypes: [
    'User', 'Course', 'Lesson', 'Enrollment', 'Quiz', 'Assignment', 'Review', 'Coupon', 'Category', 'Banner', 'Section', 'Page', 'School', 'Student', 'StudentParent', 'Batch', 'BatchStudent', 'Instrument', 'Level', 'Timetable', 'ClassSession', 'Attendance',
    'BatchCourse', 'ClassProgress', 'StudentProgress', 'Package'
    , 'Mode'
  ],
  endpoints: (builder) => ({
    // Shared endpoints can go here, expanded later
    checkHealth: builder.query({
      query: () => ({ url: '/health', method: 'GET' }),
    }),
    getAdminUsers: builder.query({
      query: (params) => ({ 
        url: '/admin/users', 
        method: 'GET',
        params: {
          search: params?.search || '',
          role: params?.role || 'all',
          page: params?.page || 1,
          limit: params?.limit || 10
        }
      }),
      providesTags: ['User'],
    }),
    createAdminUser: builder.mutation({
      query: (data) => ({
        url: '/admin/users',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['User'],
    }),
    updateAdminUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteAdminUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getAdminCourses: builder.query({
      query: () => ({ url: '/admin/courses', method: 'GET' }),
      providesTags: ['Course'],
    }),
    createAdminCourse: builder.mutation({
      query: (data) => ({
        url: '/admin/courses',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Course'],
    }),
    updateAdminCourse: builder.mutation({
      query: (data) => ({
        url: '/admin/courses',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['Course'],
    }),
    deleteAdminCourse: builder.mutation({
      query: (courseId) => ({
        url: `/admin/courses?courseId=${courseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Course'],
    }),
    getAdminSettings: builder.query({
      query: () => ({ url: '/admin/settings', method: 'GET' }),
      providesTags: ['Setting'],
    }),
    updateAdminSettings: builder.mutation({
      query: (data) => ({
        url: '/admin/settings',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Setting'],
    }),
    getAdminInstructors: builder.query({
      query: (params) => ({
        url: '/admin/instructors',
        params: {
          search: params?.search || '',
          page: params?.page || 1,
          limit: params?.limit || 10
        }
      }),
      providesTags: ['User'],
    }),
    getAdminInstructorById: builder.query({
      query: (id) => ({
        url: `/admin/instructors/${id}`,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    createAdminInstructor: builder.mutation({
      query: (data) => ({
        url: '/admin/instructors',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['User'],
    }),
    updateAdminInstructor: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/instructors/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['User'],
    }),
    getInstructorStats: builder.query({
      query: (id) => ({ url: `/admin/instructors/${id}/stats` }),
    }),
    getInstructorCourses: builder.query({
      query: (id) => ({ url: `/admin/instructors/${id}/courses` }),
    }),
    getAdminDashboardStats: builder.query({
      query: () => ({ url: '/admin/dashboard' }),
      providesTags: ['User', 'Course', 'Enrollment', 'Payment'],
    }),
    getSchoolAdminDashboardStats: builder.query({
      query: () => ({ url: '/admin/dashboard/school' }),
      providesTags: ['Student', 'User', 'Batch', 'Timetable'],
    }),
    adminLogout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getAdminCategories: builder.query({
      query: () => ({ url: '/admin/categories', method: 'GET' }),
      providesTags: ['Category'],
    }),
    createAdminCategory: builder.mutation({
      query: (data) => ({
        url: '/admin/categories',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Category'],
    }),
    updateAdminCategory: builder.mutation({
      query: (data) => ({
        url: '/admin/categories',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteAdminCategory: builder.mutation({
      query: (id) => ({
        url: `/admin/categories?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    getAdminBanners: builder.query({
      query: () => ({ url: '/admin/banners', method: 'GET' }),
      providesTags: ['Banner'],
    }),
    createAdminBanner: builder.mutation({
      query: (data) => ({
        url: '/admin/banners',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Banner'],
    }),
    updateAdminBanner: builder.mutation({
      query: (data) => ({
        url: '/admin/banners',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Banner'],
    }),
    deleteAdminBanner: builder.mutation({
      query: (id) => ({
        url: `/admin/banners?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banner'],
    }),
    getAdminPages: builder.query({
      query: () => ({ url: '/admin/pages', method: 'GET' }),
      providesTags: ['Page'],
    }),
    createAdminPage: builder.mutation({
      query: (data) => ({
        url: '/admin/pages',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Page'],
    }),
    updateAdminPage: builder.mutation({
      query: (data) => ({
        url: '/admin/pages',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Page'],
    }),
    deleteAdminPage: builder.mutation({
      query: (id) => ({
        url: `/admin/pages?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Page'],
    }),
    getPublicPage: builder.query({
      query: (slug) => ({ url: `/pages/${slug}`, method: 'GET' }),
    }),
    getAdminCourseSections: builder.query({
      query: (courseId) => ({ url: `/admin/courses/${courseId}/sections`, method: 'GET' }),
      providesTags: ['Section'],
    }),
    createAdminCourseSection: builder.mutation({
      query: ({ courseId, ...data }) => ({
        url: `/admin/courses/${courseId}/sections`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Section'],
    }),
    updateAdminSection: builder.mutation({
      query: ({ courseId, sectionId, ...data }) => ({
        url: `/admin/courses/${courseId}/sections/${sectionId}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Section'],
    }),
    deleteAdminSection: builder.mutation({
      query: ({ courseId, sectionId }) => ({
        url: `/admin/courses/${courseId}/sections/${sectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Section'],
    }),
    reorderAdminCourseSections: builder.mutation({
      query: ({ courseId, elements }) => ({
        url: `/admin/courses/${courseId}/sections/reorder`,
        method: 'PUT',
        data: { elements },
      }),
      invalidatesTags: ['Section'],
    }),
    getCourseSections: builder.query({
      query: (courseId) => ({ url: `/instructor/courses/${courseId}/sections`, method: 'GET' }),
      providesTags: ['Section'],
    }),
    createCourseSection: builder.mutation({
      query: ({ courseId, ...data }) => ({
        url: `/instructor/courses/${courseId}/sections`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Section'],
    }),
    updateSection: builder.mutation({
      query: ({ courseId, sectionId, ...data }) => ({
        url: `/instructor/courses/${courseId}/sections/${sectionId}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Section'],
    }),
    deleteSection: builder.mutation({
      query: ({ courseId, sectionId }) => ({
        url: `/instructor/courses/${courseId}/sections/${sectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Section'],
    }),
    reorderCourseSections: builder.mutation({
      query: ({ courseId, elements }) => ({
        url: `/instructor/courses/${courseId}/sections/reorder`,
        method: 'PUT',
        data: { elements },
      }),
      invalidatesTags: ['Section'],
    }),
    getLessons: builder.query({
      query: (sectionId) => ({ url: `/sections/${sectionId}/lessons`, method: 'GET' }),
      providesTags: ['Lesson'],
    }),
    createLesson: builder.mutation({
      query: ({ sectionId, ...data }) => ({
        url: `/sections/${sectionId}/lessons`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Lesson', 'Section'],
    }),
    updateLesson: builder.mutation({
      query: ({ lessonId, ...data }) => ({
        url: `/lessons/${lessonId}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Lesson', 'Section'],
    }),
    deleteLesson: builder.mutation({
      query: (lessonId) => ({
        url: `/lessons/${lessonId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lesson', 'Section'],
    }),

    // ── Student Learning Page ──────────────────────────────────────────────
    getLearningCourse: builder.query({
      query: (courseId) => ({ url: `/student/learn/${courseId}`, method: 'GET' }),
      providesTags: ['Enrollment', 'Course', 'Section', 'Lesson'],
    }),
    markLessonComplete: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: '/student/progress',
        method: 'POST',
        data: { courseId, lessonId },
      }),
      invalidatesTags: ['Enrollment'],
    }),
    getVideoPlayUrl: builder.mutation({
      query: ({ lessonId, deviceId }) => ({
        url: '/videos/play',
        method: 'POST',
        data: { lessonId, deviceId },
      }),
    }),
    getCourseProgress: builder.query({
      query: (courseId) => ({ url: `/progress/${courseId}`, method: 'GET' }),
      providesTags: ['Enrollment'],
    }),
    markProgressComplete: builder.mutation({
      query: ({ courseId, lessonId }) => ({
        url: '/progress/mark-complete',
        method: 'POST',
        data: { courseId, lessonId },
      }),
      invalidatesTags: ['Enrollment'],
    }),
    updateLastLesson: builder.mutation({
      query: ({ courseId, lastLessonId }) => ({
        url: `/progress/${courseId}`,
        method: 'PATCH',
        data: { lastLessonId },
      }),
      invalidatesTags: ['Enrollment'],
    }),

    // ── Public Homepage Endpoints ──────────────────────────────────────────
    getCategories: builder.query({
      query: () => ({ url: '/categories', method: 'GET' }),
      providesTags: ['Category'],
    }),
    getCourses: builder.query({
      query: (params) => ({ 
        url: '/courses', 
        method: 'GET',
        params 
      }),
      providesTags: ['Course'],
    }),
    getInstructors: builder.query({
      query: () => ({ url: '/instructors', method: 'GET' }),
      providesTags: ['User'],
    }),
    getAnalyticsSummary: builder.query({
      query: () => ({ url: '/analytics/summary', method: 'GET' }),
    }),
    getReviews: builder.query({
      query: () => ({ url: '/reviews', method: 'GET' }),
      providesTags: ['Review'],
    }),
    getPublicSettings: builder.query({
      query: () => ({ url: '/settings', method: 'GET' }),
      providesTags: ['Setting'],
    }),
    getAdminSchools: builder.query({
      query: (params) => ({ url: '/admin/schools', method: 'GET', params }),
      providesTags: ['School'],
    }),
    createAdminSchool: builder.mutation({
      query: (data) => ({ url: '/admin/schools', method: 'POST', data }),
      invalidatesTags: ['School'],
    }),
    updateAdminSchool: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/schools/${id}`, method: 'PUT', data }),
      invalidatesTags: ['School'],
    }),
    deleteAdminSchool: builder.mutation({
      query: (id) => ({ url: `/admin/schools/${id}`, method: 'DELETE' }),
      invalidatesTags: ['School'],
    }),

    // ── Student CRM ──────────────────────────────────────────────────────
    getAdminStudents: builder.query({
      query: (params) => ({ url: '/admin/students', method: 'GET', params }),
      providesTags: ['Student'],
    }),
    getAdminStudentById: builder.query({
      query: (id) => ({ url: `/admin/students/${id}`, method: 'GET' }),
      providesTags: ['Student'],
    }),
    createAdminStudent: builder.mutation({
      query: (data) => ({ url: '/admin/students', method: 'POST', data }),
      invalidatesTags: ['Student', 'User'],
    }),
    updateAdminStudent: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/students/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Student'],
    }),
    deleteAdminStudent: builder.mutation({
      query: (id) => ({ url: `/admin/students/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Student', 'User'],
    }),
    getAdminStudentParents: builder.query({
      query: (id) => ({ url: `/admin/students/${id}/parents`, method: 'GET' }),
      providesTags: ['StudentParent'],
    }),
    createAdminStudentParent: builder.mutation({
      query: ({ studentId, ...data }) => ({ url: `/admin/students/${studentId}/parents`, method: 'POST', data }),
      invalidatesTags: ['StudentParent'],
    }),

    // ── Batch & Enrollment ───────────────────────────────────────────────
    getAdminBatches: builder.query({
      query: (params) => ({ url: '/admin/batches', method: 'GET', params }),
      providesTags: ['Batch'],
    }),
    getAdminBatchById: builder.query({
      query: (id) => ({ url: `/admin/batches/${id}`, method: 'GET' }),
      providesTags: ['Batch'],
    }),
    createAdminBatch: builder.mutation({
      query: (data) => ({ url: '/admin/batches', method: 'POST', data }),
      invalidatesTags: ['Batch'],
    }),
    updateAdminBatch: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/batches/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Batch'],
    }),
    deleteAdminBatch: builder.mutation({
      query: (id) => ({ url: `/admin/batches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Batch'],
    }),
    getAdminBatchStudents: builder.query({
      query: (id) => ({ url: `/admin/batches/${id}/students`, method: 'GET' }),
      providesTags: ['BatchStudent'],
    }),
    enrollStudentInBatch: builder.mutation({
      query: ({ batchId, ...data }) => ({ url: `/admin/batches/${batchId}/students`, method: 'POST', data }),
      invalidatesTags: ['BatchStudent', 'Batch'],
    }),
    removeStudentFromBatch: builder.mutation({
      query: ({ batchId, studentId }) => ({ url: `/admin/batches/${batchId}/students/${studentId}`, method: 'DELETE' }),
      invalidatesTags: ['BatchStudent', 'Batch'],
    }),
    // ── Instrumental & Levels ─────────────────────────────────────────────
    getAdminInstruments: builder.query({
      query: (params) => ({ url: '/admin/instruments', method: 'GET', params }),
      providesTags: ['Instrument'],
    }),
    createAdminInstrument: builder.mutation({
      query: (data) => ({ url: '/admin/instruments', method: 'POST', data }),
      invalidatesTags: ['Instrument'],
    }),
    updateAdminInstrument: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/instruments/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Instrument'],
    }),
    deleteAdminInstrument: builder.mutation({
      query: (id) => ({ url: `/admin/instruments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Instrument'],
    }),
    getAdminModes: builder.query({
      query: (params) => ({ url: '/admin/modes', method: 'GET', params }),
      providesTags: ['Mode'],
    }),
    createAdminMode: builder.mutation({
      query: (data) => ({ url: '/admin/modes', method: 'POST', data }),
      invalidatesTags: ['Mode'],
    }),
    updateAdminMode: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/modes/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Mode'],
    }),
    deleteAdminMode: builder.mutation({
      query: (id) => ({ url: `/admin/modes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Mode'],
    }),
    getAdminLevels: builder.query({
      query: (params) => ({ url: '/admin/levels', method: 'GET', params }),
      providesTags: ['Level'],
    }),
    createAdminLevel: builder.mutation({
      query: (data) => ({ url: '/admin/levels', method: 'POST', data }),
      invalidatesTags: ['Level'],
    }),
    updateAdminLevel: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/levels/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Level'],
    }),
    deleteAdminLevel: builder.mutation({
      query: (id) => ({ url: `/admin/levels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Level'],
    }),

    // Timetable Endpoints
    getAdminTimetables: builder.query({
      query: (params) => {
        let queryString = '';
        if (params) {
          const searchParams = new URLSearchParams();
          if (params.schoolId) searchParams.append('schoolId', params.schoolId);
          if (params.teacherId) searchParams.append('teacherId', params.teacherId);
          if (params.batchId) searchParams.append('batchId', params.batchId);
          if (params.dayOfWeek) searchParams.append('dayOfWeek', params.dayOfWeek);
          if (params.status) searchParams.append('status', params.status);
          const str = searchParams.toString();
          if (str) queryString = `?${str}`;
        }
        return { url: `/admin/timetable${queryString}` };
      },
      providesTags: ['Timetable'],
    }),
    createAdminTimetable: builder.mutation({
      query: (timetableData) => ({
        url: '/admin/timetable',
        method: 'POST',
        data: timetableData,
      }),
      invalidatesTags: ['Timetable'],
    }),
    updateAdminTimetable: builder.mutation({
      query: ({ id, ...timetableData }) => ({
        url: `/admin/timetable/${id}`,
        method: 'PUT',
        data: timetableData,
      }),
      invalidatesTags: ['Timetable'],
    }),
    deleteAdminTimetable: builder.mutation({
      query: (id) => ({
        url: `/admin/timetable/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Timetable'],
    }),
    
    // ── Attendance & Sessions ───────────────────────────────────────────
    getAdminClassSessions: builder.query({
      query: (params) => ({ url: '/admin/class-sessions', method: 'GET', params }),
      providesTags: ['ClassSession'],
    }),
    createAdminClassSession: builder.mutation({
      query: (data) => ({ url: '/admin/class-sessions', method: 'POST', data }),
      invalidatesTags: ['ClassSession'],
    }),
    getAdminAttendance: builder.query({
      query: (params) => ({ url: '/admin/attendance', method: 'GET', params }),
      providesTags: ['Attendance'],
    }),
    getAttendanceReport: builder.query({
      query: (params) => ({
        url: '/admin/attendance/report',
        params,
      }),
      providesTags: ['Attendance'],
    }),

    // --- LMS / Batch Progress ---
    getBatchCourse: builder.query({
      query: (batchId) => `/admin/batches/${batchId}/course`,
      providesTags: ['BatchCourse'],
    }),
    assignBatchCourse: builder.mutation({
      query: ({ batchId, courseId }) => ({
        url: `/admin/batches/${batchId}/course`,
        method: 'POST',
        body: { courseId },
      }),
      invalidatesTags: ['BatchCourse'],
    }),
    getClassSessionNextLesson: builder.query({
      query: (sessionId) => `/admin/class-sessions/${sessionId}/lesson`,
      providesTags: ['ClassProgress'],
    }),
    completeClassLesson: builder.mutation({
      query: (data) => ({
        url: '/admin/class-sessions/complete-lesson',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassProgress', 'StudentProgress'],
    }),
    getStudentLmsProgress: builder.query({
      query: () => '/student/progress',
      providesTags: ['StudentProgress'],
    }),
    markAttendance: builder.mutation({
      query: (data) => ({ url: '/admin/attendance', method: 'POST', data }),
      invalidatesTags: ['Attendance', 'ClassSession'],
    }),

    // ── Package CRUD ──────────────────────────────────────────────────────
    getAdminPackages: builder.query({
      query: (params) => ({ url: '/admin/packages', method: 'GET', params }),
      providesTags: ['Package'],
    }),
    createAdminPackage: builder.mutation({
      query: (data) => ({ url: '/admin/packages', method: 'POST', data }),
      invalidatesTags: ['Package'],
    }),
    updateAdminPackage: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/admin/packages/${id}`, method: 'PUT', data }),
      invalidatesTags: ['Package'],
    }),
    deleteAdminPackage: builder.mutation({
      query: (id) => ({ url: `/admin/packages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Package'],
    }),

    getPackages: builder.query({
      query: (params) => ({ url: '/packages', method: 'GET', params }),
      providesTags: ['Package'],
    }),
  }),
});

export const {
  useCheckHealthQuery,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminCoursesQuery,
  useCreateAdminCourseMutation,
  useUpdateAdminCourseMutation,
  useDeleteAdminCourseMutation,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminInstructorsQuery,
  useGetAdminInstructorByIdQuery,
  useCreateAdminInstructorMutation,
  useUpdateAdminInstructorMutation,
  useGetInstructorStatsQuery,
  useGetInstructorCoursesQuery,
  useGetAdminDashboardStatsQuery,
  useGetSchoolAdminDashboardStatsQuery,
  useAdminLogoutMutation,
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useGetAdminBannersQuery,
  useCreateAdminBannerMutation,
  useUpdateAdminBannerMutation,
  useDeleteAdminBannerMutation,
  useGetAdminCourseSectionsQuery,
  useCreateAdminCourseSectionMutation,
  useUpdateAdminSectionMutation,
  useDeleteAdminSectionMutation,
  useReorderAdminCourseSectionsMutation,
  useGetCourseSectionsQuery,
  useCreateCourseSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderCourseSectionsMutation,
  useGetLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useGetLearningCourseQuery,
  useMarkLessonCompleteMutation,
  useGetVideoPlayUrlMutation,
  useGetCourseProgressQuery,
  useMarkProgressCompleteMutation,
  useUpdateLastLessonMutation,
  // Public
  useGetCategoriesQuery,
  useGetCoursesQuery,
  useGetInstructorsQuery,
  useGetAnalyticsSummaryQuery,
  useGetReviewsQuery,
  useGetPublicSettingsQuery,
  useGetAdminPagesQuery,
  useCreateAdminPageMutation,
  useUpdateAdminPageMutation,
  useDeleteAdminPageMutation,
  useGetPublicPageQuery,

  useGetAdminSchoolsQuery,
  useCreateAdminSchoolMutation,
  useUpdateAdminSchoolMutation,
  useDeleteAdminSchoolMutation,

  // Student CRM
  useGetAdminStudentsQuery,
  useGetAdminStudentByIdQuery,
  useCreateAdminStudentMutation,
  useUpdateAdminStudentMutation,
  useDeleteAdminStudentMutation,
  useGetAdminStudentParentsQuery,
  useCreateAdminStudentParentMutation,

  // Batch & Enrollment
  useGetAdminBatchesQuery,
  useGetAdminBatchByIdQuery,
  useCreateAdminBatchMutation,
  useUpdateAdminBatchMutation,
  useDeleteAdminBatchMutation,
  useGetAdminBatchStudentsQuery,
  useEnrollStudentInBatchMutation,
  useRemoveStudentFromBatchMutation,

  useGetAdminInstrumentsQuery,
  useCreateAdminInstrumentMutation,
  useUpdateAdminInstrumentMutation,
  useDeleteAdminInstrumentMutation,
  useGetAdminModesQuery,
  useCreateAdminModeMutation,
  useUpdateAdminModeMutation,
  useDeleteAdminModeMutation,
  useGetAdminLevelsQuery,
  useCreateAdminLevelMutation,
  useUpdateAdminLevelMutation,
  useDeleteAdminLevelMutation,
  useGetAdminTimetablesQuery,
  useCreateAdminTimetableMutation,
  useUpdateAdminTimetableMutation,
  useDeleteAdminTimetableMutation,

  // Attendance & Sessions
  useGetAdminClassSessionsQuery,
  useCreateAdminClassSessionMutation,
  useGetAdminAttendanceQuery,
  useGetAttendanceReportQuery,
  useMarkAttendanceMutation,

  // LMS + Batch Integration
  useGetBatchCourseQuery,
  useAssignBatchCourseMutation,
  useGetClassSessionNextLessonQuery,
  useCompleteClassLessonMutation,
  useGetStudentLmsProgressQuery,

  // Package CRUD
  useGetAdminPackagesQuery,
  useCreateAdminPackageMutation,
  useUpdateAdminPackageMutation,
  useDeleteAdminPackageMutation,
  useGetPackagesQuery,
} = apiSlice;

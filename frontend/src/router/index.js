import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: () => import('@/views/LandingView.vue')
    },
    {
      path: '/practice',
      name: 'Practice',
      component: () => import('@/views/PracticeView.vue')
    },
    {
      path: '/flashcard',
      name: 'Flashcard',
      component: () => import('@/views/FlashcardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('@/views/AnalyticsView.vue')
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/exams/new',
      name: 'ExamCreate',
      component: () => import('@/views/ExamEditView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/exams/:id/edit',
      name: 'ExamEdit',
      component: () => import('@/views/ExamEditView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/ai-chat',
      name: 'AIChat',
      component: () => import('@/views/AIChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/essay-analysis',
      name: 'EssayAnalysis',
      component: () => import('@/views/EssayAnalysisView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subscription',
      name: 'Subscription',
      component: () => import('@/views/SubscriptionView.vue')
    },
    {
      path: '/discussions',
      name: 'Discussions',
      component: () => import('@/views/DiscussionView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/discussions/:id',
      name: 'DiscussionDetail',
      component: () => import('@/views/DiscussionDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gamification',
      name: 'GamificationDashboard',
      component: () => import('@/views/GamificationDashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/study-groups',
      name: 'StudyGroups',
      component: () => import('@/views/StudyGroupView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/mock-exams',
      name: 'MockExams',
      component: () => import('@/views/MockExamView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/exams/:id/print',
      name: 'ExamPrint',
      component: () => import('@/views/ExamPrintView.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/exams/:id/preview',
      name: 'ExamPreview',
      component: () => import('@/views/ExamPreviewView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exams/create',
      name: 'UserExamCreate',
      component: () => import('@/views/ExamEditView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exams/:id/edit',
      name: 'UserExamEdit',
      component: () => import('@/views/ExamEditView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/user-exam',
      name: 'UserExam',
      component: () => import('@/views/UserExamView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/practice/questions',
      name: 'QuestionPractice',
      component: () => import('@/views/QuestionPracticeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/views/AuthCallbackView.vue'),
      alias: '/auth/v1/callback'
    }
  ]
})

// Import Supabase for session checking
import { supabase } from '@/lib/supabase'

// Helper to check if user is authenticated (supports both Supabase and legacy)
const checkAuth = async () => {
  // Try Supabase session first
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return { isAuth: true, isAdmin: session.user.user_metadata?.is_admin || false }
    }
  } catch (e) {
    // Supabase not available, try legacy
  }

  // Fallback to localStorage (legacy Django auth)
  const token = localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')
  return {
    isAuth: !!token,
    isAdmin: userRole === 'admin'
  }
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { isAuth, isAdmin } = await checkAuth()

  // 需要認證但未登入
  if (to.meta.requiresAuth && !isAuth) {
    // 儲存原本要前往的路徑
    sessionStorage.setItem('intended_path', to.fullPath)
    // 觸發登入彈窗
    window.dispatchEvent(new Event('show-login'))
    // 導回首頁
    next('/')
  }
  // 需要管理員權限
  else if (to.meta.requiresAdmin) {
    if (!isAuth) {
      // 未登入，觸發登入彈窗
      sessionStorage.setItem('intended_path', to.fullPath)
      window.dispatchEvent(new Event('show-login'))
      next('/')
    } else if (isAdmin) {
      // 已登入且是管理員
      next()
    } else {
      // 已登入但不是管理員
      alert('需要管理員權限才能訪問此頁面')
      next('/practice')
    }
  }
  else {
    next()
  }
})

export default router

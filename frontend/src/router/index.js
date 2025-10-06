import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/practice'
    },
    {
      path: '/practice',
      name: 'Practice',
      component: () => import('@/views/PracticeView.vue')
    },
    {
      path: '/flashcard',
      name: 'Flashcard',
      component: () => import('@/views/FlashcardView.vue')
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
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin) {
    // Check if user is admin (you'll need to store this in localStorage or a store)
    const userRole = localStorage.getItem('user_role')
    if (userRole === 'admin') {
      next()
    } else {
      next('/practice')
    }
  } else {
    next()
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'

// 检查用户是否已登录
const isAuthenticated = () => {
    return !!localStorage.getItem('token')
}

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component:  () => import('../views/user/LoginView.vue'),
        meta: {
            allowAnonymous: true // 允许匿名访问
        }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/user/RegisterView.vue'),
        meta: {
            allowAnonymous: true // 允许匿名访问
        }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/user/HomeView.vue'),
        meta: {
            requiresAuth: true // 需要认证
        }
    },

    // 其他需要认证的路由...
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
    // 检查路由是否需要认证
    if (to.meta.requiresAuth) {
        // 如果需要认证但未登录，跳转到登录页
        if (!isAuthenticated()) {
            next('/login')
        } else {
            next()
        }
    } else {
        // 如果已登录且访问登录页，可以跳转到主页
        if (isAuthenticated() && to.path === '/login') {
            next('/home')
        } else {
            next()
        }
    }
})

export default router
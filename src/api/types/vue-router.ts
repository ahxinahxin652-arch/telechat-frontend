// types/vue-router.d.ts //防止报错
/* eslint-disable no-unused-vars */
import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean
        allowAnonymous?: boolean
    }
}
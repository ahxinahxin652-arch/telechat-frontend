import {defineStore} from 'pinia'
import {userApi} from '@/api/modules/user'
import {ElMessage} from "element-plus";


// 定义用户信息接口
export interface Profile {
    username: string
    nickname: string
    avatar: string
    gender: number
    bio: string
    createTime: string
    updateTime: string
    lastLoginTime: string
}

// 定义 Store
export const useUserStore = defineStore('user', {
    state: () => ({
        profile: null as Profile | null,
        lastUpdate: 0,
        cacheTime: 60000 // 1分钟缓存时间
    }),

    getters: {
        // 检查用户信息是否已加载
        isProfileLoaded: (state) => !!state.profile,

        // 获取用户信息
        getProfile: (state) => state.profile,
    },

    actions: {
        // 获取用户信息
        async fetchProfile(forceRefresh = false) {
            // 如果不强制刷新且缓存有效，则直接返回缓存数据
            if (!forceRefresh && this.$state.profile && (Date.now() - this.$state.lastUpdate) < this.$state.cacheTime) {
                console.log('使用缓存数据，距离上次更新: ', Date.now() - this.$state.lastUpdate, 'ms');
                return this.profile
            }
            console.log('开始获取用户信息')
            try {
                // 调用API获取用户信息
                const response = await userApi.getProfile()
                this.profile = response.data
                this.lastUpdate = Date.now()
                return this.profile;
            } catch (error) {
                console.error('获取用户信息失败:', error)
                throw error
            }
        },

        // 设置用户信息
        async setProfile(userInfo: Profile) {
            // 调用API请求
            const response = await userApi.updateProfile(userInfo)
            if (response && response.code === 200) {
                ElMessage.success('更新用户信息成功')
                this.profile = userInfo;
                this.lastUpdate = Date.now();
            } else {
                throw new Error('更新用户信息失败');
            }
        },

        // 上传头像
        async uploadAvatar(file: File): Promise<string> {
            try {
                const response = await userApi.uploadAvatar(file);
                if (response && response.code === 200) {
                    ElMessage.success('头像上传成功');
                    // 更新用户信息中的头像URL
                    if (this.profile) {
                        this.profile.avatar = response.data;
                        this.lastUpdate = Date.now();
                    }
                    return response.data; // 返回头像URL
                } else {
                    console.log(response.msg || '头像上传失败');
                    return  '';
                }
            } catch (error) {
                ElMessage.error(error instanceof Error ? error.message : '头像上传失败');
                throw error;
            }
        },

        // 清除用户信息（退出登录时使用）
        clearProfile() {
            this.profile = null
            this.lastUpdate = 0
        }
    }
})
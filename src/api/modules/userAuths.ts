import request from '../request'
import {
    VerifyCodeRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ResetPasswordRequest
} from '../types/userAuths'

// 用户认证相关API
export const userApi = {
    /**
     * 获取验证码
     * @param data 验证码信息
     */
    getVerifyCode(data: VerifyCodeRequest): Promise<any> {
        return request.post('/user/sendVerifyCode', data)
    },

    /**
     * 用户登录
     * @param data 登录信息
     */
    login(data: LoginRequest): Promise<LoginResponse> {
        return request.post('/user/login', data)
    },

    /**
     * 用户注册
     * @param data 注册信息
     */
    register(data: RegisterRequest): Promise<any> {
        return request.post('/user/register', data)
    },

    /**
     * 重置密码
     * @param data 重置密码信息
     */
    resetPassword(data: ResetPasswordRequest): Promise<any> {
        return request.post('/user/reset-password', data)
    },
}
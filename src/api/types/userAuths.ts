// 验证码请求参数
export interface VerifyCodeRequest {
    type: number
    identifyType: string
    identifier: string
}


// 登录请求参数
export interface LoginRequest {
    identifyType: string
    identifier: string
    verifyCode: string
}

// 登录响应数据
export interface LoginResponse {
    code: number
    msg: string
    data: {
        token: string
        tokenType: string
        expiresIn: bigint
        profile: {
            username: string
            nickname: string
            avatar: string
            gender: number
            bio: string
            createTime: string
            updateTime: string
            lastLoginTime: string
        }
    }
}

// 注册请求参数
export interface RegisterRequest {
    identifyType: string
    identifier: string
    verifyCode: string
}


// 重置密码请求参数
export interface ResetPasswordRequest {
    identifyType: string
    identifier: string
    verifyCode: string
    password: string
}


// 获取个人信息response
export interface GetProfileResponse {
    code: number
    msg: string
    data: {
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

// 更新个人信息request
export interface UpdateProfileRequest {
    nickname: string
    gender: number
    bio: string
}

// 更新个人信息response
export interface UpdateProfileResponse {
    code: number
    msg: string
    data: {}
}

// 上传头像request (FormData格式)
export interface UploadAvatarRequest {
    avatar: File
}

// 上传头像response
export interface UploadAvatarResponse {
    code: number
    msg: string
    data: string // 返回头像URL路径
}
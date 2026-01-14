import request from "../request";

import {
    GetProfileResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UploadAvatarResponse,

} from "../types/user";

// 用户信息相关API
export const userApi = {
    /**
    * 获取个人简介
     * @returns Promise<GetProfileResponse>
    * */
    getProfile(): Promise<GetProfileResponse> {
        return request.get('/profile')
    },

    /**
    * 更新个人简介
     * @param data 个人简介信息
     * @returns Promise<UpdateProfileResponse>
    * */
    updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
        return request.put('/profile/update', data)
    },

    /**
     * 上传头像
     * @param file 头像文件
     * @returns Promise<UploadAvatarResponse>
     */
    uploadAvatar(file: File): Promise<UploadAvatarResponse> {
        const formData = new FormData();
        formData.append('avatar', file);
        return request.post('/profile/uploadAvatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}
// src/api/modules/contactApply.ts

import request from "../request";
import {
    AddContactApplyDTO,
    ContactApplyHandleDTO,
    AddContactApplyResponse,
    ApplyListResponse,
    HandleApplyResponse,
    GetUnreadCountResponse,
    MarkAllResponse,
} from "../types/contactApply";

// 联系人申请相关API
export const contactApplyApi = {
    /**
     * 发送添加联系人申请
     * @param data 包含目标用户名的数据对象
     * @returns Promise<AddContactApplyResponse>
     */
    addContactApply(data: AddContactApplyDTO): Promise<AddContactApplyResponse> {
        return request.post('/contactApply/add', data);
    },

    /**
     * 获取未处理的联系人申请列表
     * @returns Promise<ApplyListResponse>
     */
    getApplyList(): Promise<ApplyListResponse> {
        return request.get('/contactApply/apply/list');
    },

    /**
     * 处理联系人申请（同意或拒绝）
     * @param data 包含申请ID及是否同意的数据对象
     * @returns Promise<HandleApplyResponse>
     */
    handleApply(data: ContactApplyHandleDTO): Promise<HandleApplyResponse> {
        return request.post('/contactApply/apply/handle', data);
    },

    /**
     * 获取未读联系人申请总数
     * @returns Promise<GetUnreadCountResponse>
     */
    getUnreadCount(): Promise<GetUnreadCountResponse> {
        return request.get('/contactApply/unread-count');
    },

    /**
     * 已读未读联系人申请
     * @returns Promise<MarkAllResponse>
     */
    markAll(): Promise<MarkAllResponse> {
        return request.put('/contactApply/read-all');
    },
};

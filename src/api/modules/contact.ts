// src/api/modules/contact.ts

import request from "../request";
import {
    GetContactsResponse,
    DeleteContactResponse,
    UpdateContactRequest,
    UpdateContactResponse
} from "../types/contact";

// 联系人相关 API
export const contactApi = {
    /**
     * 获取联系人列表
     * @returns Promise<GetContactsResponse>
     */
    getContacts(): Promise<GetContactsResponse> {
        return request.get('/contact/list');
    },

    /**
     * 删除联系人
     * @param id 联系人ID
     * @returns Promise<DeleteContactResponse>
     */
    deleteContact(id: number): Promise<DeleteContactResponse> {
        return request.delete(`/contact/${id}`);
    },

    /**
     * 更新联系人备注
     * @param data 更新联系人信息
     * @returns Promise<UpdateContactResponse>
     */
    updateContact(data: UpdateContactRequest): Promise<UpdateContactResponse> {
        return request.put('/contact/update', data);
    }
};

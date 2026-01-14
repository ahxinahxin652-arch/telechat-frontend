// src/api/types/contact.ts

export interface ContactVO {
    id: number;
    userId: number;
    username: string;
    nickname: string;
    avatar: string;
    remark: string;
}

export interface UpdateContactDTO {
    contactId: number;
    remark: string;
}

// 获取联系人列表 response
export interface GetContactsResponse {
    code: number;
    msg: string;
    data: ContactVO[];
}

// 删除联系人 response
export interface DeleteContactResponse {
    code: number;
    msg: string;
    data: string; // 成功消息如"删除成功"
}

// 更新联系人 request
export interface UpdateContactRequest extends UpdateContactDTO {}

// 更新联系人 response
export interface UpdateContactResponse {
    code: number;
    msg: string;
    data: string; // 成功消息如"更新成功"
}

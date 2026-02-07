// src/api/types/contactApply.ts

/**
 * 添加联系人申请请求参数
 */
export interface AddContactApplyDTO {
    userName: string;
}

/**
 * 联系人申请处理请求参数
 */
export interface ContactApplyHandleDTO {
    contactId: number;
    agree: boolean;
}

/**
 * 联系人申请信息 VO
 */
export interface ContactApplyVO {
    id: number;
    username: string;
    avatar: string;
    nickname: string;
    status: string;
    createTime: string; // 使用字符串表示时间，在实际使用时可转换为 Date 对象
}

/**
 * 添加联系人申请响应
 */
export interface AddContactApplyResponse {
    code: number;
    msg: string;
    data: string | null;
}

/**
 * 获取联系人申请列表响应
 */
export interface ApplyListResponse {
    code: number;
    msg: string;
    data: ContactApplyVO[];
}

/**
 * 处理联系人申请响应
 */
export interface HandleApplyResponse {
    code: number;
    msg: string;
    data: string | null;
}

/**
 * 获取未读联系人申请总数响应
 */
export interface GetUnreadCountResponse {
    code: number;
    msg: string;
    data: number | 0;
}

/**
 * 已读未读联系人申请响应
 */
export interface MarkAllResponse {
    code: number;
    msg: string;
    data: string | 0;
}
export enum ConversationType{
    // eslint-disable-next-line no-unused-vars
    PRIVATE = 0, // 私聊
    // eslint-disable-next-line no-unused-vars
    GROUP = 1,   // 群聊
    // eslint-disable-next-line no-unused-vars
    CHANNEL = 2   // 频道
}

// 会话VO
export interface ConversationVO{
    id: string;
    type: ConversationType;
    title: string;
    avatar: string;
    unreadCount: number;
    isTop: boolean;
    isMuted: boolean;
    lastMessageContent: string;
    lastMessageTime: string;
    score: number;
}



/**
 * 预热会话请求
 * 通常预热是基于当前登录用户的，所以 body 可能为空，userId 从 Token 获取
 */
export interface PreHeatConversationRequest {
    // 如果需要为指定用户预热（后台管理用）
    userId?: string;
}

/**
 * 懒加载会话请求
 */
export interface LazyLoadConversationRequest {
    // 游标：对应后端代码中的 cursor。
    // 第一页传 0，后续传上一页最后一条数据的 score
    cursor: number;
}

/**
 * 预热会话相应
 */
export interface PreHeatConversationResponse{
    code: number;
    msg: string;
    data:[] | null
}

/**
 * 预热会话相应
 */
export interface LazyLoadConversationResponse{
    code: number;
    msg: string;
    data: ConversationVO[];
}
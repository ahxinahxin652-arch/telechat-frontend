// 单人聊天请求
export interface SingleChatRequest {
    receiverId: bigint
    content: string
}

// 单人聊天响应
export interface SingleChatResponse {
    code: number
    msg: string
    data: {
        id: bigint
        senderId: bigint
        receiverId: bigint
        content: string
        timestamp: string
        status: string
    }
}
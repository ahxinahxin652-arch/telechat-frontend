import request from "../request";

import {
    SingleChatRequest,
    SingleChatResponse,
} from "../types/chat";

// 聊天相关api
export const chatApi = {
    /**
    *  单聊
     *  @param data
     *  @return SingleChatResponse
    * */
    singleChat(data: SingleChatRequest): Promise<SingleChatResponse> {
        return request.post("/chat/single", data);
    },
};
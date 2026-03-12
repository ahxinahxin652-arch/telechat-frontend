import request from "../request";

import {
    PreHeatConversationRequest,
    PreHeatConversationResponse,
    LazyLoadConversationRequest,
    LazyLoadConversationResponse,

} from "../types/conversation";


// 会话信息相关API
export const conversationApi = {
    /**
     * 预热会话
     * @returns Promise<GetProfileResponse>
     * */
    preHeat(data: PreHeatConversationRequest): Promise<PreHeatConversationResponse> {
        return request.get('/conversation/preHeat', {
            params: data // GET 参数必须包裹在 params 字段中
        });
    },

    /**
     * 懒加载会话
     * @param data 个人简介信息
     * @returns Promise<UpdateProfileResponse>
     * */
    lazyLoad(data: LazyLoadConversationRequest): Promise<LazyLoadConversationResponse> {
        return request.get('/conversation/lazyLoad', {
            params: data // 自动转换成 /conversation/lazyLoad?cursor=xxx
        });
    },
}
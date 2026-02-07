import { defineStore } from 'pinia';
import {contactApplyApi} from "@/api/modules/contactApply";

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        contactApplyCount: 0, // 好友申请未读数
        systemNotifyCount: 0, // 系统通知未读数 (预留)
    }),
    getters: {
        // 计算总消息数（用于左上角主按钮）
        totalCount: (state) => state.contactApplyCount + state.systemNotifyCount,
    },
    actions: {
        // 初始化/轮询时调用：从后端拉取最新数量
        async fetchUnreadCounts() {
            try {
                const res = await contactApplyApi.getUnreadCount();
                if (res.code === 200) {
                    this.contactApplyCount = res.data;
                }
            } catch (error) {
                console.error("获取通知数量失败", error);
            }
        },

        // WebSocket 推送时调用：直接 +1
        incrementContactApply() {
            this.contactApplyCount++;
        },

        // 打开弹窗时调用：清零
        async clearContactApply() {
            if (this.contactApplyCount === 0) return;
            try {
                // 先乐观更新 UI，让红点立即消失，体验更好
                this.contactApplyCount = 0;
                // 后台同步
                await contactApplyApi.markAll();
            } catch (error) {
                // 失败处理...
            }
        }
    }
});
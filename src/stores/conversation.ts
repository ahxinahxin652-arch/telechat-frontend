import { defineStore } from 'pinia';
import { conversationApi } from '@/api/modules/conversation';
import type { ConversationVO } from '@/api/types/conversation';

export const useConversationStore = defineStore('conversation', {
    state: () => ({
        conversationList: [] as ConversationVO[], // 会话列表数据
        cursor: 0, // 当前加载到的最小 score (下一页的起点)，0 代表第一页
        hasMore: true, // 是否还有更多数据 (触底判定)
        isLoading: false, // 懒加载防抖锁：防止用户疯狂下拉发出重复请求
        isPreHeating: false, // 预热防抖锁
    }),

    getters: {
        // 计算总未读数（可用于底部导航栏 Badge 展示）
        totalUnreadCount: (state) => {
            return state.conversationList.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
        },
        // 获取置顶的会话（如果前端需要单独渲染置顶区域）
        topConversations: (state) => {
            return state.conversationList.filter(item => item.isTop);
        }
    },

    actions: {
        /**
         * 1. 触发后台异步预热
         * 通常在用户刚登录，或者从后台切回前台时调用
         */
        async preHeat() {
            if (this.isPreHeating) return;
            this.isPreHeating = true;
            try {
                // 预热只是通知后端干活，不需要等待返回值，也不影响前端当前展示
                await conversationApi.preHeat({});
            } catch (error) {
                console.error("预热会话失败", error);
            } finally {
                this.isPreHeating = false;
            }
        },

        /**
         * 2. 懒加载/下拉刷新会话列表 (核心逻辑)
         * @param isRefresh 是否是强制刷新 (如：下拉刷新归零)
         */
        async loadMore(isRefresh = false) {
            // 拦截：如果正在加载中，或者已经到底了(且不是强刷)，直接中断
            if (this.isLoading || (!this.hasMore && !isRefresh)) return;

            this.isLoading = true;

            // 如果是刷新，重置游标和状态，但不立即清空 list (防止 UI 闪烁，等新数据回来再替换)
            if (isRefresh) {
                this.cursor = 0;
                this.hasMore = true;
            }

            try {
                const res = await conversationApi.lazyLoad({ cursor: this.cursor });
                const newData = res.data || [];

                // 【核心防线 1：哨兵拦截】检查后端是否传回了 "-1" 哨兵
                const sentinelIndex = newData.findIndex(item => item.id === "-1");
                let validData = newData;

                if (sentinelIndex !== -1) {
                    this.hasMore = false; // 命中哨兵，标记彻底触底
                    validData = newData.slice(0, sentinelIndex); // 剔除哨兵及之后的所有脏数据
                }

                if (isRefresh) {
                    // 刷新：直接替换
                    this.conversationList = validData;
                } else {
                    // 懒加载追加：【核心防线 2：高性能去重】
                    // 防止因数据滑动期间有新消息插入，导致同一条数据在两页中重复出现
                    const existingIds = new Set(this.conversationList.map(item => item.id));
                    const uniqueNewItems = validData.filter(item => !existingIds.has(item.id));

                    this.conversationList.push(...uniqueNewItems);
                }

                // 【核心防线 3：游标更新】更新最小 score 供下次请求使用
                if (this.conversationList.length > 0) {
                    this.cursor = this.conversationList[this.conversationList.length - 1].score;
                }

            } catch (error) {
                console.error("获取会话列表失败", error);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * 3. 丝滑体验必备：WebSocket 收到新消息时，局部更新会话并重排版
         * @param updatedConvo 包含最新消息内容的会话对象
         */
        updateOrInsertConversation(updatedConvo: ConversationVO) {
            const index = this.conversationList.findIndex(c => c.id === updatedConvo.id);

            if (index !== -1) {
                // 场景 A：会话已存在，更新内容、时间、未读数和 score
                this.conversationList[index] = {
                    ...this.conversationList[index],
                    ...updatedConvo
                };
            } else {
                // 场景 B：全新会话（别人刚加你发的第一条消息），直接插入
                this.conversationList.push(updatedConvo);
            }

            // 【重排序】：因为有了新消息，该会话的 score 变大了，必须重新按 score 降序排列
            // 这样这个会话就会“丝滑”地飞到列表最顶部！
            this.conversationList.sort((a, b) => b.score - a.score);
        },

        /**
         * 4. 清除特定会话未读数 (点进聊天框时触发)
         */
        clearUnreadCount(conversationId: string) {
            const index = this.conversationList.findIndex(c => c.id === conversationId);
            if (index !== -1 && this.conversationList[index].unreadCount > 0) {
                // 乐观更新 UI：立马消灭红点
                this.conversationList[index].unreadCount = 0;
                // TODO: 异步调用后端 API 同步未读数清零状态
                // conversationApi.clearUnread(conversationId);
            }
        },

        /**
         * 5. 退出登录时清理状态
         */
        clearStore() {
            this.conversationList = [];
            this.cursor = 0;
            this.hasMore = true;
            this.isLoading = false;
        }
    }
});
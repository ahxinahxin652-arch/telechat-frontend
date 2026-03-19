import { defineStore } from 'pinia';
import { conversationApi } from '@/api/modules/conversation';
import type { ConversationVO } from '@/api/types/conversation';
import { ElMessage } from "element-plus";

export const userConversationStore = defineStore('conversation', {
    state: () => ({
        conversationList: [] as ConversationVO[], // 会话列表数据
        cursor: 0, // 当前加载到的最小 score (下一页的起点)，0 代表第一页
        hasMore: true, // 是否还有更多数据 (触底判定)
        isLoading: false, // 懒加载防抖锁
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
         */
        async preHeat() {
            if (this.isPreHeating) return;
            this.isPreHeating = true;
            try {
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

            // 优化体验：如果是刷新，取 0 为游标，但不立刻清空状态，防止接口报错导致页面白屏闪烁
            const fetchCursor = isRefresh ? 0 : this.cursor;

            try {
                const res = await conversationApi.lazyLoad({ cursor: fetchCursor });
                const newData = res.data || [];

                // 【防线 1：哨兵与空数据拦截】
                const sentinelIndex = newData.findIndex(item => item.id === "-1");
                let validData = newData;

                if (sentinelIndex !== -1) {
                    this.hasMore = false; // 命中哨兵，标记彻底触底
                    validData = newData.slice(0, sentinelIndex); // 剔除脏数据
                } else if (newData.length === 0) {
                    this.hasMore = false; // 后端没传哨兵但数据为空，同样触底
                } else if (isRefresh) {
                    this.hasMore = true;  // 刷新且有数据，重置触底状态
                }

                // 【防线 2：精准记录下一次游标】(核心修复)
                // 必须从 validData 中取最小 score 作为游标，而不是依赖 this.conversationList
                if (validData.length > 0) {
                    this.cursor = Math.min(...validData.map(item => item.score));
                }

                if (isRefresh) {
                    // 刷新：直接替换
                    this.conversationList = validData;
                } else {
                    // 懒加载追加：【高性能去重】防止数据滑动期间新消息导致错位重复
                    const existingIds = new Set(this.conversationList.map(item => item.id));
                    const uniqueNewItems = validData.filter(item => !existingIds.has(item.id));
                    this.conversationList.push(...uniqueNewItems);
                }

                // 统一排序：确保置顶的在最前面，同状态按 score 降序
                this.sortConversations();

            } catch (error) {
                console.error("获取会话列表失败", error);
                ElMessage.error("获取会话列表失败，请检查网络");
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * 3. 丝滑体验必备：WebSocket 收到新消息时的局部更新
         * @param updatedConversation 包含最新消息内容的会话对象
         */
        updateOrInsertConversation(updatedConversation: ConversationVO) {
            const index = this.conversationList.findIndex(c => c.id === updatedConversation.id);

            if (index !== -1) {
                // 场景 A：会话已存在
                const existingConv = this.conversationList[index];
                // 合并最新属性
                const mergedConv = { ...existingConv, ...updatedConversation };

                // 【体验优化】：先将它从原位置拔出
                this.conversationList.splice(index, 1);
                // 再插到数组最头部 (最新消息理应在最上面)
                this.conversationList.unshift(mergedConv);
            } else {
                // 场景 B：全新会话，直接放在最前面
                this.conversationList.unshift(updatedConversation);
            }

            // 【体验优化】：重新整理排序，处理 "置顶会话" 的优先级
            this.sortConversations();
        },

        /**
         * 4. 清除特定会话未读数 (点进聊天框时触发)
         */
        // eslint-disable-next-line no-unused-vars
        clearUnreadCount(conversationId: string) {
/*            const index = this.conversationList.findIndex(c => c.id === conversationId);
            if (index !== -1 && this.conversationList[index].unreadCount > 0) {
                // 乐观更新 UI：立马消灭红点
                this.conversationList[index].unreadCount = 0;
                // 调用 API，不阻塞前端
                conversationApi.clearUnread(conversationId).catch(err => {
                    console.error("清除未读数失败", err);
                });
            }*/
        },

        /**
         * 内部公共方法：按照企业级 IM 规则排序
         * 规则：置顶会话(isTop = true)永远在最上面，同一层级按 score 降序排列
         */
        sortConversations() {
            this.conversationList.sort((a, b) => {
                if (a.isTop !== b.isTop) {
                    return a.isTop ? -1 : 1; // a如果是置顶，排前面
                }
                return b.score - a.score; // 状态一样，score(时间戳)大的排前面
            });
        },

        /**
         * 5. 退出登录时清理状态
         */
        clearStore() {
            this.conversationList = [];
            this.cursor = 0;
            this.hasMore = true;
            this.isLoading = false;
            this.isPreHeating = false;
        }
    }
});
import {defineStore} from 'pinia';
import {ElMessage} from 'element-plus';

export const useWebSocketStore = defineStore('websocket', {
    state: () => ({
        ws: null as WebSocket | null,
        isConnected: false,             // 当前连接状态
        reconnectTimer: null as ReturnType<typeof setTimeout> | null,
        reconnectAttempts: 0,           // 当前重连次数
        maxReconnectAttempts: 10,       // 最大重连次数
        reconnectInterval: 3000,        // 重连间隔(毫秒)
        latestMessage: null as any,     // 存储最新的一条消息，供 Vue 组件监听
        manualClose: false,             // 标记是否为手动关闭（防止退出登录时触发重连）
    }),

    getters: {
        // 判断当前 WebSocket 是否处于可用状态
        isReady: (state) => state.isConnected && state.ws?.readyState === WebSocket.OPEN,
    },

    actions: {

        /**
         * 1. 初始化 WebSocket 连接
         */
        initWebsocket() {
            // 已连接则不重复连接
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("WebSocket 初始化失败：未找到 token");
                return;
            }

            this.manualClose = false;
            // 获取环境变量中的后台地址，默认 fallback 到 localhost
            const baseUrl = 'ws://localhost:8888';
            const wsUrl = `${baseUrl}/ws/chat?token=${encodeURIComponent(token)}`;

            try {
                this.ws = new WebSocket(wsUrl);
            } catch (e) {
                console.error("创建 WebSocket 实例失败", e);
                this.handleReconnect();
                return;
            }

            // 连接成功回调
            this.ws.onopen = () => {
                ElMessage.success("WebSocket 连接已成功建立");
                console.log('WebSocket 连接已成功建立');
                this.isConnected = true;
                this.reconnectAttempts = 0; // 重置重连次数
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            // 接收消息回调
            this.ws.onmessage = (event) => {
                try {
                    // 将最新消息存入 state，组件可通过 watch 监听
                    this.latestMessage = JSON.parse(event.data);
                    console.log(event.data);
                    ElMessage.success("接收消息："+this.latestMessage);
                    // 类型判断
                    // if (message.type === 'chat') {
                    //    useConversationStore().updateOrInsertConversation(message);
                    // } else if (message.type === 'contact_apply') {
                    //    ...
                    // }
                } catch (error) {
                    console.error('WebSocket 消息解析失败:', error, event.data);
                }
            };

            // 错误回调
            this.ws.onerror = (error) => {
                ElMessage.error('WebSocket 发生错误:' + error);
                this.isConnected = false;
            };

            // 关闭回调
            this.ws.onclose = (event) => {
                console.log(`WebSocket 连接已关闭 (code: ${event.code})`);
                this.isConnected = false;
                this.ws = null;

                // 核心逻辑：如果是意外断开（非主动退出），则触发自动重连
                if (!this.manualClose) {
                    this.handleReconnect();
                }
            };
        },

        /**
         * 2. 断线重连机制
         */
        handleReconnect() {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('WebSocket 重连失败：已达到最大尝试次数');
                ElMessage.error('聊天服务器连接断开，请检查网络或刷新页面');
                return;
            }

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }

            this.reconnectTimer = setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`WebSocket 准备第 ${this.reconnectAttempts} 次重连...`);
                this.initWebsocket();
            }, this.reconnectInterval);
        },

        /**
         * 3. 统一发送消息入口
         * @param message 消息对象
         * @returns boolean 是否发送成功
         */
        sendMessage(message: any): boolean {
            if (this.isReady) {
                this.ws!.send(JSON.stringify(message));
                return true;
            } else {
                console.warn('WebSocket 尚未连接，消息发送失败', message);
                ElMessage.warning('网络未连接，发送失败');
                return false;
            }
        },

        /**
         * 4. 主动关闭 WebSocket（用于退出登录）
         */
        closeWebsocket() {
            this.manualClose = true; // 打上标记，阻止触发重连
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.isConnected = false;
            this.reconnectAttempts = 0;
            this.latestMessage = null;
        }
    }
});
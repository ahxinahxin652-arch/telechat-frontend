<template>
  <div class="common-layout">
    <el-container style="width: 100%;height: 100%;">
      <el-aside class="sidebar" width="260px">
        <div class="chat-list">
          <div class="chat-search">
            <el-button type="primary" circle size="small" @click="toggleSideBarView">
              <el-icon>
                <Operation/>
              </el-icon>
            </el-button>
            <el-input
                v-model="searchMessage"
                class="side-input"
                placeholder="Search"
                clearable>
            </el-input>
          </div>

          <div class="chat-items">
            <ConversationItem
                v-for="chat in chatList"
                :key="chat.id"
                :chat="chat"
                :is-active="selectedChat && selectedChat.id === chat.id"
                @click="selectChat(chat)"
            />
          </div>
        </div>
      </el-aside>

      <el-container class="main-container">
        <ChatWindow
            v-if="selectedChat"
            :chat-info="selectedChat"
            :messages="messages"
            :current-user-id="currentUserId"
            @send-message="handleSendMessage"
        />
        <div v-else style="flex: 1; background-color: var(--bg-color2);"></div>
      </el-container>
    </el-container>

    <SideBarView
        v-model="showSideBarView"
        @close="showSideBarView = false"
        @profile="goToProfile"
        @create-group="createNewGroup"
        @create-channel="createNewChannel"
        @my-contacts="goToMyContacts"
        @settings="goToSettings"
        @logout="logout"
    />

    <Profile
        v-model="showProfile"
        @close="showProfile = false"
    />
    <MyContacts
        v-model="showMyContacts"
        @close="showMyContacts = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { Operation } from '@element-plus/icons-vue'
import SideBarView from '@/components/SideBarView.vue'
import Profile from '@/components/Profile.vue'
import MyContacts from "@/components/MyContacts.vue"
import { ElMessage } from 'element-plus'
import themeManager from '@/utils/themeManager'
import ConversationItem, { ChatItemInfo } from '@/components/chat/ConversationItem.vue'
import ChatWindow from '@/components/chat/ChatWindow.vue'

export default defineComponent({
  name: 'HomeView',
  components: {
    Operation,
    SideBarView,
    Profile,
    MyContacts,
    ConversationItem,
    ChatWindow
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      searchMessage: '',
      websocket: null as WebSocket | null,

      // 当前用户ID，用于判断消息左右显示。此处暂时模拟为0，请根据实际 store 数据调整
      currentUserId: 0 as number | string,

      chatList: [
        {
          id: '1',
          name: '张三',
          avatar: 'Z',
          lastMessage: '在吗？',
          lastTime: '10:30',
          unreadCount: 2
        },
        {
          id: '2',
          name: '李四',
          avatar: 'L',
          lastMessage: '好的',
          lastTime: '09:15',
          unreadCount: 0
        },
        {
          id: '3',
          name: '王五',
          avatar: 'W',
          lastMessage: '明天见',
          lastTime: '昨天',
          unreadCount: 1
        }
      ] as ChatItemInfo[],

      selectedChat: null as ChatItemInfo | null,
      messages: [] as any[],
      showSideBarView: false,
      showProfile: false,
      showMyContacts: false,
    }
  },
  methods: {
    toggleSideBarView() {
      this.showSideBarView = !this.showSideBarView;
    },
    selectChat(chat: ChatItemInfo) {
      this.selectedChat = chat
      console.log('选中聊天:', chat.name)
      this.loadMessages(chat.id)
    },
    loadMessages(chatId: string) {
      console.log('加载聊天消息:', chatId)
      // 模拟加载消息数据（保持原样结构）
      // 实际应请求接口
      this.messages = [
        {
          senderId: '1', // 对方
          content: '以上组件采用了 flex 布局，使用前请确定目标浏览器是否兼容。',
          timestamp: '10:25'
        },
        {
          senderId: 0, // 自己
          content: '你好！',
          timestamp: '10:26'
        }
      ];
    },
    handleSendMessage(content: string) {
      // 1. WebSocket 发送逻辑 (保持原样)
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.selectedChat) {
        const message = {
          type: 'chat',
          receiverId: parseInt(this.selectedChat.id),
          content: content
        };
        this.websocket.send(JSON.stringify(message));
      } else {
        // ElMessage.error('WebSocket连接未建立'); // 暂时屏蔽报错方便调试
      }

      // 2. 本地 UI 更新
      this.messages.push({
        senderId: this.currentUserId,
        content: content,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      });
    },

    // 其他原样方法
    async goToProfile() { this.showProfile = true; },
    createNewGroup() { console.log('创建新群聊'); ElMessage.info('创建新群聊功能待实现'); },
    createNewChannel() { console.log('创建新频道'); ElMessage.info('创建新频道功能待实现'); },
    goToMyContacts() { console.log('跳转到我的联系人'); this.showMyContacts = true; },
    goToSettings() { console.log('跳转到设置'); },
    logout() { console.log('退出登录'); },

    initWebsocket() {
      const token = localStorage.getItem('token');
      if (!token) {
        // ElMessage.error('未找到认证令牌');
        return;
      }
      const wsUrl = `ws://localhost:8888/ws/chat?token=${encodeURIComponent(token)}`;
      this.websocket = new WebSocket(wsUrl);
      this.websocket.onopen = () => { console.log('WebSocket连接已建立'); };
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('收到消息:', message);
        this.handleIncomingMessage(message);
      };
      this.websocket.onerror = (error) => { console.error('WebSocket错误:', error); };
      this.websocket.onclose = () => { console.log('WebSocket连接已关闭'); };
    },
    handleIncomingMessage(message: any) {
      // 简单处理：如果是当前会话，push 进去
      if (message.type === 'chat' && this.selectedChat) {
        // 需要判断 sender 是否匹配当前会话
        this.messages.push({
          senderId: message.senderId || 'other',
          content: message.content,
          timestamp: 'Now'
        });
      }
    }
  },
  mounted() {
    themeManager.init();
    this.initWebsocket();
    if (this.chatList.length > 0) {
      this.selectChat(this.chatList[0])
    }
  }
})
</script>

<style scoped>
/*------------------------------------------------全局设定-------------------------------------------------------*/
.common-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 全局icon设定 */
.common-layout .el-icon {
  background-color: var(--icon-color);
  width: 30px;
  height: 30px;
  font-size: 25px;
  padding: 0;
}

.common-layout .el-icon:hover {
  color: var(--hover-icon-color);
  transition: all 0.3s;
}

/* 全局文字设定 */
.common-layout {
  color: var(--font-color);
}

/*------------------------------------------------侧边栏-------------------------------------------------------*/
/* 侧边栏样式 */
.sidebar {
  background-color: var(--bg-color1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: var(--border-color) 1px solid;
}

.chat-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-search {
  padding: 10px 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center; /* 上下居中对齐 */
  justify-content: space-between; /* 左右分布 */
  gap: 15px; /* 元素间距 */
}

/* 修改输入框内部样式 - 使用更具体的选择器 */
.chat-search :deep(.el-input__wrapper) {
  background-color: var(--input-color) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  border: 1px solid transparent !important;
}

/* 修改输入框聚焦状态 */
.chat-search :deep(.el-input__wrapper.is-focus) {
  background-color: var(--input-color) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* 修改输入框文字颜色 */
.chat-search :deep(.el-input__inner) {
  background-color: var(--input-color) !important;
  border-radius: 10px !important;
}

/* 修改占位符颜色 */
.chat-search :deep(.el-input__inner::placeholder) {
  color: #aaa !important;
}

.chat-items {
  flex: 1;
  overflow-y: auto;
}

/* 主内容区域样式 */
.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
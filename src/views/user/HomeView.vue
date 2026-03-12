<template>
  <div class="common-layout">
    <el-container style="width: 100%;height: 100%;">
      <el-aside class="sidebar" width="260px">
        <Conversation
            @toggle-sidebar="toggleSideBarView"
            @select-chat="handleSelectChat"
        />
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

    <SideBarView v-model="showSideBarView" @close="showSideBarView = false" @profile="goToProfile" @create-group="createNewGroup" @create-channel="createNewChannel" @my-contacts="goToMyContacts" @settings="goToSettings" @logout="logout" />
    <Profile v-model="showProfile" @close="showProfile = false" />
    <MyContacts v-model="showMyContacts" @close="showMyContacts = false" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import SideBarView from '@/components/SideBarView.vue'
import Profile from '@/components/Profile.vue'
import MyContacts from "@/components/MyContacts.vue"
import Conversation from '@/components/chat/Conversation.vue' // 引入新建的 Conversation 组件
import ChatWindow from '@/components/chat/ChatWindow.vue'
import { ChatItemInfo } from '@/components/chat/ConversationItem.vue'
import { ElMessage } from 'element-plus'
import themeManager from '@/utils/themeManager'

export default defineComponent({
  name: 'HomeView',
  components: {
    SideBarView,
    Profile,
    MyContacts,
    Conversation,
    ChatWindow
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      websocket: null as WebSocket | null,
      currentUserId: 0 as number | string,
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

    // 接收 Conversation 子组件传来的选中事件
    handleSelectChat(chatInfo: ChatItemInfo) {
      this.selectedChat = chatInfo
      this.loadMessages(chatInfo.id)
    },

    loadMessages(chatId: string) {
      console.log('加载聊天消息:', chatId)
      // 模拟加载消息数据（实际应请求接口）
      this.messages = [
        {
          senderId: '1',
          content: '以上组件采用了 flex 布局，使用前请确定目标浏览器是否兼容。',
          timestamp: '10:25'
        },
        {
          senderId: 0,
          content: '你好！',
          timestamp: '10:26'
        }
      ];
    },

    handleSendMessage(content: string) {
      // WebSocket 发送逻辑
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.selectedChat) {
        const message = {
          type: 'chat',
          receiverId: parseInt(this.selectedChat.id),
          content: content
        };
        this.websocket.send(JSON.stringify(message));
      } else {
        // ElMessage.error('WebSocket连接未建立');
      }

      // 本地 UI 更新
      this.messages.push({
        senderId: this.currentUserId,
        content: content,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      });
    },

    // 其他原有方法
    async goToProfile() { this.showProfile = true; },
    createNewGroup() { console.log('创建新群聊'); ElMessage.info('创建新群聊功能待实现'); },
    createNewChannel() { console.log('创建新频道'); ElMessage.info('创建新频道功能待实现'); },
    goToMyContacts() { console.log('跳转到我的联系人'); this.showMyContacts = true; },
    goToSettings() { console.log('跳转到设置'); },
    logout() { console.log('退出登录'); },

    initWebsocket() {
      const token = localStorage.getItem('token');
      if (!token) return;

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
      if (message.type === 'chat' && this.selectedChat) {
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
  }
})
</script>

<style scoped>
/* 全局设定 */
.common-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  color: var(--font-color);
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

/* 侧边栏布局样式 */
.sidebar {
  background-color: var(--bg-color1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: var(--border-color) 1px solid;
}

/* 主内容区域样式 */
.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
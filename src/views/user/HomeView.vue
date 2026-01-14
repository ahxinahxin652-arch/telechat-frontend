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
            <!-- 使用 v-for 动态渲染聊天项 -->
            <div
                v-for="chat in chatList"
                :key="chat.id"
                class="chat-item"
                :class="{ active: selectedChat && selectedChat.id === chat.id }"
                @click="selectChat(chat)"
            >
              <div class="avatar">{{ chat.avatar || chat.name.charAt(0) }}</div>
              <div class="chat-info">
                <div class="chat-name">{{ chat.name }}</div>
                <div class="last-message">{{ chat.lastMessage }}</div>
              </div>
              <div class="chat-time">{{ chat.lastTime }}</div>
            </div>
          </div>
        </div>
      </el-aside>

      <el-container class="main-container">
        <!-- 主内容保持不变 -->
        <el-header class="chat-header">
          <div class="chat-header-info">
            <div class="avatar">U</div>
            <div class="user-info">
              <div class="user-name">用户名</div>
              <div class="user-status">在线</div>
            </div>
          </div>
          <div class="chat-header-actions">
            <el-button circle size="small">
              <el-icon>
                <Search/>
              </el-icon>
            </el-button>
            <el-button circle size="small">
              <el-icon>
                <More/>
              </el-icon>
            </el-button>
          </div>
        </el-header>

        <el-main class="chat-messages">
          <div class="message-list">
            <div class="message received">
              <div class="avatar">U</div>
              <div class="message-content">
                <div class="message-text">以上组件采用了 flex 布局，使用前请确定目标浏览器是否兼容。
                  此外，的直接子元素必须是后四个组件中的一个或多个。 后四个组件的父元素必须是一个
                </div>
                <div class="message-time">10:25</div>
              </div>
            </div>
            <div class="message sent">
              <div class="avatar">M</div>
              <div class="message-content">
                <div class="message-text">你好！</div>
                <div class="message-time">10:26</div>
              </div>
            </div>
          </div>
        </el-main>

        <el-footer class="chat-input">
          <div class="input-container">
            <el-button circle>
              <el-icon>
                <Paperclip/>
              </el-icon>
            </el-button>
            <el-input
                v-model="inputMessage"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 10}"
                placeholder="Write a message"
                class="message-input"
            ></el-input>
            <el-button type="primary" circle>
              <el-icon>
                <Position/>
              </el-icon>
            </el-button>
          </div>
        </el-footer>
      </el-container>
    </el-container>

    <!-- 侧边栏视图 -->
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
import {defineComponent} from 'vue'
import {useRouter} from 'vue-router'
import {
  Search,
  More,
  Paperclip,
  Position,
  Operation,
} from '@element-plus/icons-vue'
import SideBarView from '@/components/SideBarView.vue'
import Profile from '@/components/Profile.vue'
import MyContacts from "@/components/MyContacts.vue";
import {ElMessage} from 'element-plus'
import themeManager from '@/utils/themeManager'


// 定义聊天项接口
interface ChatItem {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  lastTime: string
  unreadCount?: number
  status?: 'online' | 'offline' | 'away'
}

export default defineComponent({
  name: 'HomeView',
  components: {
    Operation,
    Search,
    More,
    Paperclip,
    Position,
    SideBarView,
    Profile,
    MyContacts,
  },
  setup() {
    const router = useRouter() // 在 setup 中获取 router 实例
    return {
      // 返回 router 实例供模板使用
      router
    }
  },
  data() {
    return {
      // 联系搜索输入
      searchMessage: '',

      // webSocket
      websocket: null as WebSocket | null,

      // 聊天列表数据
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
      ] as ChatItem[],

      // 选择的聊天
      selectedChat: null as ChatItem | null,

      // 聊天输入框信息
      inputMessage: '',

      // 聊天消息列表
      messages: [] as any[],

      // 加载状态
      loading: false,

      // 控制侧边栏视图显示
      showSideBarView: false,

      // 显示个人信息
      showProfile: false,

      // 显示我的联系人
      showMyContacts: false,
    }
  },
  methods: {
    // 切换侧边栏视图
    toggleSideBarView() {
      this.showSideBarView = !this.showSideBarView;
    },

    // 选择聊天项
    selectChat(chat: ChatItem) {
      // 设置选中的聊天项
      this.selectedChat = chat

      // 这里可以添加加载聊天消息的逻辑
      console.log('选中聊天:', chat.name)

      // 模拟加载消息
      this.loadMessages(chat.id)
    },

    // 加载消息
    loadMessages(chatId: string) {
      // 模拟加载消息的逻辑
      console.log('加载聊天消息:', chatId)
      // 实际项目中这里会调用API获取消息
    },

    // 初始化聊天列表
    initChatList() {
      // 模拟从API获取聊天列表
      // 实际项目中这里会调用API
    },


    // 跳转到个人信息
    async goToProfile() {
      this.showProfile = true;
    },

    // 创建新群聊
    createNewGroup() {
      console.log('创建新群聊')
      ElMessage.info('创建新群聊功能待实现')
    },

    // 创建新频道
    createNewChannel() {
      console.log('创建新频道')
      ElMessage.info('创建新频道功能待实现')
    },

    // 我的联系人
    goToMyContacts() {
      console.log('跳转到我的联系人页面')
      ElMessage.info('我的联系人功能待实现')
      this.showMyContacts = true;
    },

    // 跳转到设置
    goToSettings() {
      console.log('跳转到设置页面')
      // this.$router.push('/settings')
    },

    logout() {
      // 模拟退出登录
      console.log('退出登录')
    },

    // 初始化websocket
    initWebsocket() {
      // 获取JWT token（假设存储在localStorage中）
      const token = localStorage.getItem('token');
      if (!token) {
        ElMessage.error('未找到认证令牌');
        return;
      }

      // 创建WebSocket连接
      const wsUrl = `ws://localhost:8888/ws/chat?token=${encodeURIComponent(token)}`;
      this.websocket = new WebSocket(wsUrl);

      // 监听连接打开
      this.websocket.onopen = () => {
        console.log('WebSocket连接已建立');
        ElMessage.success('WebSocket连接成功');
      };

      // 监听消息接收
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('收到消息:', message);

        // 根据消息类型处理
        switch (message.type) {
          case 'system':
            console.log('系统消息:', message.content);
            break;
          case 'chat':
            // 处理聊天消息
            this.handleIncomingMessage(message);
            break;
          case 'ack':
            // 处理消息确认
            console.log('消息确认:', message);
            break;
          case 'typing':
            // 处理输入状态
            console.log('对方正在输入...');
            break;
        }
      };

      // 监听连接错误
      this.websocket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        ElMessage.error('WebSocket连接出错');
      };

      // 监听连接关闭
      this.websocket.onclose = () => {
        console.log('WebSocket连接已关闭');
        ElMessage.warning('WebSocket连接已断开');
      };
    },

    // 处理接收到的消息
    handleIncomingMessage(message: any) {
      // 在这里更新UI，显示新消息
      console.log('处理新消息:', message);
    },

    // 发送消息
    sendMessage(content: string, receiverId: string) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'chat',
          receiverId: parseInt(receiverId),
          content: content
        };
        this.websocket.send(JSON.stringify(message));
      } else {
        ElMessage.error('WebSocket连接未建立');
      }
    }
  },
  mounted() {
    // 初始化主题
    themeManager.init();

    this.initWebsocket();

    // 初始化时选中第一个聊天
    if (this.chatList.length > 0) {
      this.selectChat(this.chatList[0])
    }
  },
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

.chat-item {
  display: flex;
  padding: 12px 15px;
  cursor: pointer;

  transition: all 0.2s;
}

.chat-item:hover {
  background-color: var(--side-chat-hover-color);
}

.chat-item.active {
  background-color: var(--side-chat-active-color);
}

/* 头像样式调整 */
.avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  margin: 0 8px;
}

.chat-info {
  flex: 1;
  overflow: hidden;
}

.chat-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.last-message {
  font-size: 13px;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

/* 主内容区域样式 */
.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  background-color: var(--bg-color1);
  border-bottom: var(--border-color) 1px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 15px;
}

.user-name {
  font-weight: 500;
  font-size: 16px;
}

.user-status {
  font-size: 13px;
  color: #4caf50;
}

.chat-header-actions {
  display: flex;
  gap: 10px;
}

/*                              输入消息                                                    */
.chat-input {
  background-color: var(--bg-color1);
  padding-top: 10px;
  padding-bottom: 10px;
  height: auto; /* 高度随输入框的行数变化而变化 */
}

.chat-input .el-icon {
  width: 35px;
  height: 35px;
  font-size: 28px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.message-input {
  outline: none;
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  outline: none;
  border: none;
  box-shadow: none;
  background-color: var(--bg-color1);
  resize: none;
  padding: 10px;
  min-height: 35px !important;
  color: white;
}

/* 添加这一部分确保聚焦时也没有边框 */
.message-input :deep(.el-textarea__inner:focus) {
  outline: none;
  border: none;
  box-shadow: none;
}


/* 消息相关 *//*------------------------------------------------------------------------------------*/
/* 聊天消息区域调整 */
.chat-messages {
  background-color: var(--bg-color2);
  padding: 10px 20px;
  overflow-y: auto;
  flex: 1;
}

.message-text {
  padding: 8px 12px;
  border-radius: 18px;
  word-wrap: break-word;
  max-width: 100%;
  line-height: 1.4;
}

.message.received .message-text {
  background-color: var(--received-color);
  border-radius: 4px 18px 18px 18px;
}

.message.sent .message-text {
  background-color: var(--sent-color);
  border-radius: 18px 4px 18px 18px;
}

/* 调整消息时间样式 */
.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  align-self: flex-end;
}

/* 调整消息内容布局 */
.message-content {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

.message.received .message-content {
  align-items: flex-start;
}

.message.sent .message-content {
  align-items: flex-end;
}

/* 调整整体消息布局 */
.message {
  display: flex;
  margin-bottom: 10px;
  max-width: 40%; /* 消息宽度限制在40%以下*/
}

.message.received {
  align-self: flex-start;
}

.message.sent {
  align-self: flex-end;
  flex-direction: row-reverse;
  margin-left: auto;
}

.message.received .avatar {
  margin-left: 0;
  margin-right: 8px;
}

.message.sent .avatar {
  margin-left: 8px;
  margin-right: 0;
}

/* 消息列表容器调整 */
.message-list {
  display: flex;
  flex-direction: column;
}

</style>
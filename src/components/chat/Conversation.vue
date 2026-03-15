<template>
  <div class="chat-list">
    <div class="chat-search">
      <el-button type="primary" circle size="small" @click="emit('toggle-sidebar')">
        <el-icon><Operation/></el-icon>
      </el-button>
      <el-input
          v-model="searchMessage"
          class="side-input"
          placeholder="Search"
          clearable>
      </el-input>
    </div>

    <div class="chat-items" ref="chatListContainer" @scroll="handleScroll">
      <ConversationItem
          v-for="chat in conversationStore.conversationList"
          :key="chat.id"
          :chat="mapToChatItem(chat)"
          :is-active="activeChatId === chat.id"
          @click="handleSelectChat(chat)"
      />

      <div class="load-more-status">
        <span v-if="conversationStore.isLoading" class="loading-text">
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </span>
        <span v-else-if="!conversationStore.hasMore && conversationStore.conversationList.length > 0" class="end-text">
          没有更多会话了
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Operation, Loading } from '@element-plus/icons-vue'
import ConversationItem, { ChatItemInfo } from '@/components/chat/ConversationItem.vue'
import { userConversationStore } from '@/stores/conversation'

// eslint-disable-next-line no-undef
const emit = defineEmits(['toggle-sidebar', 'select-chat'])

const conversationStore = userConversationStore()
const searchMessage = ref('')
const activeChatId = ref<string | number | null>(null)
const scrollTicking = ref(false)

// 初始化会话列表
const initConversations = async () => {
  try {
    await conversationStore.preHeat()
    await conversationStore.loadMore(true)
  } catch (error) {
    console.error("初始化会话失败:", error)
  }
}

// 滚动懒加载检测
const handleScroll = (e: Event) => {
  if (scrollTicking.value) return

  window.requestAnimationFrame(() => {
    const target = e.target as HTMLElement
    const bottomDistance = target.scrollHeight - target.scrollTop - target.clientHeight

    if (bottomDistance <= 1) {
      conversationStore.loadMore(false)
    }
    scrollTicking.value = false
  })
  scrollTicking.value = true
}

// VO映射转换
const mapToChatItem = (vo: any): ChatItemInfo => {
  return {
    id: vo.id || vo.conversationId,
    name: vo.title || vo.name || '未知会话',
    avatar: vo.avatar,
    lastMessage: vo.lastMessageContent || '',
    lastTime: formatTime(vo.lastMessageTime),
    unreadCount: vo.unreadCount || 0,
    status: vo.status === 1 ? 'online' : 'offline'
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 选中会话逻辑
const handleSelectChat = (rawChat: any) => {
  const chatInfo = mapToChatItem(rawChat)
  activeChatId.value = chatInfo.id

  // 清除未读数
  conversationStore.clearUnreadCount(chatInfo.id)
  // 通知父组件切换聊天窗口
  emit('select-chat', chatInfo)
}

onMounted(() => {
  initConversations()
})

onUnmounted(() => {
  // 组件销毁时清理 Store，防止重新登录数据串台
  conversationStore.clearStore()
})
</script>

<style scoped>
/* 保持原样式不变 */
.el-icon {
  width: 30px;
  height: 30px;
  font-size: 25px;
  padding: 0;
  background-color: var(--icon-color);
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
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.chat-search :deep(.el-input__wrapper) {
  background-color: var(--input-color) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  border: 1px solid transparent !important;
}

.chat-search :deep(.el-input__wrapper.is-focus) {
  background-color: var(--input-color) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.chat-search :deep(.el-input__inner) {
  background-color: var(--input-color) !important;
  border-radius: 10px !important;
}

.chat-search :deep(.el-input__inner::placeholder) {
  color: #aaa !important;
}

.chat-items {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-items::-webkit-scrollbar {
  width: 4px;
}
.chat-items::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.load-more-status {
  padding: 15px 0;
  text-align: center;
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 5px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
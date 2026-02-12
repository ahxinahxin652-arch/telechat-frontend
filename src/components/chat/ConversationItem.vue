<template>
  <div
      class="chat-item"
      :class="{ active: isActive }"
      @click="$emit('click')"
  >
    <div class="avatar">{{ chat.avatar || chat.name.charAt(0) }}</div>
    <div class="chat-info">
      <div class="chat-name">{{ chat.name }}</div>
      <div class="last-message">{{ chat.lastMessage }}</div>
    </div>
    <div class="chat-time">{{ chat.lastTime }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export interface ChatItemInfo {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  lastTime: string
  unreadCount?: number
  status?: 'online' | 'offline' | 'away'
}

export default defineComponent({
  name: 'ConversationItem',
  props: {
    chat: {
      type: Object as PropType<ChatItemInfo>,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
})
</script>

<style scoped>
/* 从原 HomeView 提取的样式，保持原样 */
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
</style>
<template>
  <div
      class="chat-item"
      :class="{ active: isActive }"
      @click="$emit('click')"
  >
    <div class="avatar">
      <img class="avatar-img"
           v-if="chat.avatar"
           :src="chat.avatar"
           :alt="chat.name[0]">
      <span v-else>{{ chat.name[0] }}</span>
    </div>

    <div class="chat-info">
      <div class="chat-header">
        <div class="chat-name" :title="chat.name">{{ chat.name }}</div>
        <div class="chat-time">{{ chat.lastTime }}</div>
      </div>
      <div class="last-message">{{ chat.lastMessage }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export interface ChatItemInfo {
  id: string
  name: string
  avatar?: string
  isTop: boolean
  isMuted: boolean
  lastMessage: string
  lastTime: string
  unreadCount?: number
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
/* 保持原版的外层布局 */
.chat-item {
  display: flex;
  padding: 11px 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-item:hover {
  background-color: var(--side-chat-hover-color);
}

.chat-item.active {
  background-color: var(--side-chat-active-color);
}

/* 保持原版的头像样式 */
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--font-color);
  color: var(--font-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  margin: 0 8px;
  overflow: hidden; /* 防止图片溢出圆形 */
}

/* 修复内部img标签撑破圆角的问题 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 恢复原版的默认顶部对齐，取消垂直居中 */
.chat-info {
  flex: 1;
  min-width: 0; /* 唯一加的属性：必须保留，否则子元素的 text-overflow: ellipsis 不生效 */
}

/* 包装头部，使其两端对齐 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 名字和时间在同一行内对齐 */
  margin-bottom: 4px; /* 继承原版 chat-name 的下边距 */
}

.chat-name {
  font-size: 15px;
  font-weight: 400; /* 保持原版字重 */
  margin-left: 5px; /* 保持原版左边距 */

  /* 核心截断逻辑 */
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px; /* 留出离时间的距离 */
}

.chat-time {
  font-size: 12px;
  color: var(--font-color);
  flex-shrink: 0; /* 核心逻辑：确保时间不被压缩 */
}

.last-message {
  font-size: 13px;
  font-weight: normal;
  padding-left: 5px;

  color: var(--last-message-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
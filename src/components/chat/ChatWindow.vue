<template>
  <el-container class="chat-window-inner" style="height: 100%;">
    <el-header class="chat-header">
      <div class="chat-header-info">
        <div class="avatar">{{ chatInfo?.avatar || 'U' }}</div>
        <div class="user-info">
          <div class="user-name">{{ chatInfo?.name || '用户名' }}</div>
          <div class="user-status">在线</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <el-button circle size="small">
          <el-icon><Search/></el-icon>
        </el-button>
        <el-button circle size="small">
          <el-icon><More/></el-icon>
        </el-button>
      </div>
    </el-header>

    <el-main class="chat-messages" ref="messageContainer">
      <div class="message-list">
        <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message"
            :class="msg.senderId === currentUserId ? 'sent' : 'received'"
        >
          <div class="avatar">{{ msg.senderId === currentUserId ? 'M' : 'U' }}</div>
          <div class="message-content">
            <div class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ msg.timestamp || '10:26' }}</div>
          </div>
        </div>
      </div>
    </el-main>

    <el-footer class="chat-input">
      <div class="input-container">
        <el-button circle>
          <el-icon><Paperclip/></el-icon>
        </el-button>
        <el-input
            v-model="inputMessage"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 10}"
            placeholder="Write a message"
            class="message-input"
            @keydown="handleKeydown"
        ></el-input>
        <el-button type="primary" circle @click="handleSend">
          <el-icon><Position/></el-icon>
        </el-button>
      </div>
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, PropType } from 'vue'
import { Search, More, Paperclip, Position } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'ChatWindow',
  components: { Search, More, Paperclip, Position },
  props: {
    chatInfo: {
      type: Object,
      default: () => ({})
    },
    messages: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    // 用来判断消息是接收还是发送，需与 message 中的 senderId 对比
    currentUserId: {
      type: [String, Number],
      default: 0
    }
  },
  emits: ['send-message'],
  setup(props, { emit }) {
    const inputMessage = ref('')
    const messageContainer = ref<HTMLElement | null>(null)

    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (messageContainer.value) {
          const container = messageContainer.value.$el
          container.scrollTop = container.scrollHeight
        }
      })
    }

    watch(() => props.messages, () => {
      scrollToBottom()
    }, { deep: true })

    const handleSend = () => {
      if (!inputMessage.value.trim()) return
      emit('send-message', inputMessage.value)
      inputMessage.value = ''
    }

    // 修改点：处理按键逻辑
    const handleKeydown = (e: KeyboardEvent) => {
      // 如果按的是 Enter 键
      if (e.key === 'Enter') {
        // 如果按下了 Shift 键（Shift+Enter），或者正在进行中文输入法输入（isComposing）
        // 则直接返回，执行默认的换行行为
        if (e.shiftKey || e.isComposing) {
          return
        }
        // 否则阻止默认换行，并发送消息
        e.preventDefault()
        handleSend()
      }
    }

    return {
      inputMessage,
      messageContainer,
      handleSend,
      handleKeydown
    }
  }
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

/* 输入消息 */
.chat-input {
  background-color: var(--bg-color1);
  padding-top: 10px;
  padding-bottom: 10px;
  height: auto;
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

.message-input :deep(.el-textarea__inner:focus) {
  outline: none;
  border: none;
  box-shadow: none;
}

/* 消息相关 */
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

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  align-self: flex-end;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 150px;
}

.message.received .message-content {
  align-items: flex-start;
}

.message.sent .message-content {
  align-items: flex-end;
}

.message {
  display: flex;
  margin-bottom: 10px;
  max-width: 40%;
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

.message-list {
  display: flex;
  flex-direction: column;
}
</style>
<template>
  <div
      v-if="modelValue"
      class="contacts-overlay"
      :class="{ show: isVisible, hide: isSlidingOut }"
      @click="handleOverlayClick"
  >
    <div
        class="new-group-modal"
        :class="{ 'slide-in': isVisible, 'slide-out': isSlidingOut }"
        @click.stop
    >
      <div class="modal-header">
        <h2>创建群聊</h2>
        <el-icon class="close-btn" @click="closeModal"><Close /></el-icon>
      </div>

      <div class="modal-body">
        <div class="left-panel">
          <div class="search-container">
            <el-input
                v-model="searchQuery"
                placeholder="搜索联系人"
                :prefix-icon="Search"
                class="search-input"
                clearable
            />
          </div>

          <div class="contacts-list">
            <div v-if="filteredContacts.length === 0" class="no-contacts">
              没有找到联系人
            </div>

            <div
                v-else
                class="contact-item"
                v-for="contact in filteredContacts"
                :key="contact.id"
                @click="toggleSelect(contact)"
            >
              <div class="checkbox" :class="{ 'is-checked': selectedIdsSet.has(contact.id) }">
                <el-icon v-if="selectedIdsSet.has(contact.id)"><Select /></el-icon>
              </div>

              <div class="contact-avatar">
                <img :src="contact.avatar || 'src/assets/img/default_avatar.png'" alt="avatar"/>
              </div>
              <div class="contact-info">
                <div class="contact-name">{{ contact.remark || contact.nickname }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="right-header">
            <div class="selected-count">
              已选择联系人: {{ selectedContacts.length }}
            </div>
          </div>

          <div class="selected-list">
            <div v-if="selectedContacts.length === 0" class="no-selected">
              请从左侧选择联系人
            </div>

            <div
                v-else
                class="selected-item"
                v-for="contact in selectedContacts"
                :key="'sel-' + contact.id"
            >
              <div class="contact-avatar small-avatar">
                <img :src="contact.avatar || 'src/assets/img/default_avatar.png'" alt="avatar"/>
              </div>
              <div class="contact-info">
                <div class="contact-name">{{ contact.remark || contact.nickname }}</div>
              </div>
              <el-icon class="remove-btn" @click="removeContact(contact.id)"><Close /></el-icon>
            </div>
          </div>

          <div class="right-footer">
            <button class="cancel-btn" @click="closeModal">取消</button>
            <button class="create-btn" :disabled="!canCreate" @click="handleCreateGroup">完成</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElInput, ElMessage } from 'element-plus'
import { Search, Close, Select } from '@element-plus/icons-vue'
import { contactApi } from "@/api/modules/contact"
import {conversationApi} from "@/api/modules/conversation";
import {userConversationStore} from "@/stores/conversation";

const conversationStore = userConversationStore()

interface Contact {
  id: string,
  userId: string,
  username: string,
  nickname: string,
  avatar: string,
  remark: string,
  bio: string
}

export default defineComponent({
  name: 'NewGroup',
  components: {
    ElInput,
    Close,
    Select
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'close'],
  data() {
    return {
      isVisible: false,
      isSlidingOut: false,
      searchQuery: '',
      contacts: [] as Contact[],
      selectedContacts: [] as Contact[],
    }
  },
  computed: {
    Search() {
      return Search
    },
    // 高性能：利用 Set 让模板中的 .has() 判断变为 O(1)
    selectedIdsSet(): Set<string> {
      return new Set(this.selectedContacts.map(c => c.id));
    },
    // 本地搜索过滤，提高用户体验
    filteredContacts(): Contact[] {
      if (!this.searchQuery) return this.contacts;
      const q = this.searchQuery.toLowerCase();
      return this.contacts.filter(c => {
        const nameMatch = c.nickname && c.nickname.toLowerCase().includes(q);
        const remarkMatch = c.remark && c.remark.toLowerCase().includes(q);
        return nameMatch || remarkMatch;
      });
    },
    // 是否允许点击“完成”按钮
    canCreate(): boolean {
      return this.selectedContacts.length > 0;
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.isSlidingOut = false;
          // 重置状态
          this.searchQuery = '';
          this.selectedContacts = [];

          this.$nextTick(() => {
            setTimeout(() => {
              this.isVisible = true;
            }, 0);
          });
          this.loadContacts();
        } else {
          this.startSlideOut();
        }
      }
    }
  },
  methods: {
    async loadContacts() {
      try {
        const response = await contactApi.getContacts();
        if (response.code === 200) {
          this.contacts = response.data;
        } else {
          ElMessage.error(response.msg);
        }
      } catch (error) {
        console.error('加载联系人失败:', error)
        ElMessage.error('加载联系人失败')
      }
    },

    toggleSelect(contact: Contact) {
      const index = this.selectedContacts.findIndex(c => c.id === contact.userId);
      if (index > -1) {
        // 已存在则移除
        this.selectedContacts.splice(index, 1);
      } else {
        // 不存在则添加
        this.selectedContacts.push(contact);
      }
    },

    removeContact(contactId: string) {
      const index = this.selectedContacts.findIndex(c => c.id === contactId);
      if (index > -1) {
        this.selectedContacts.splice(index, 1);
      }
    },

    async handleCreateGroup() {
      if (!this.canCreate) return;


      // eslint-disable-next-line no-unused-vars
      const memberIds = this.selectedContacts.map(c => c.userId);

      try {
        // 创建新群聊
        const response = await conversationApi.createGroup({memberIds });
        // 将新群聊写入前端store
        conversationStore.updateOrInsertConversation(response.data);

        // 模拟成功
        ElMessage.success(`群聊创建成功:`+ response.data);
        this.closeModal();
      } catch (error) {
        ElMessage.error("创建群聊失败");
      }
    },

    startSlideOut() {
      this.isSlidingOut = true;
      this.isVisible = false;
      setTimeout(() => {
        this.$emit('update:modelValue', false);
        this.$emit('close');
      }, 300);
    },

    closeModal() {
      this.startSlideOut();
    },

    handleOverlayClick(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.closeModal();
      }
    }
  }
})
</script>

<style scoped>
/* =========== 基础 Overlay =========== */
.contacts-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
}

.contacts-overlay.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.contacts-overlay.hide {
  background-color: rgba(0, 0, 0, 0);
}

/* =========== 创建群聊模态框 =========== */
.new-group-modal {
  position: relative;
  background-color: var(--bg-color1);
  border-radius: 12px;
  width: 90%;
  max-width: 650px; /* 比联系人列表更宽，容纳左右双栏 */
  height: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transform: scale(0.7);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.3s ease;
}

.new-group-modal.slide-in {
  transform: scale(1);
  opacity: 1;
}

.new-group-modal.slide-out {
  transform: scale(0.7);
  opacity: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color1);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--font-color);
}

.close-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--font-color);
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--side-chat-hover-color);
}

/* =========== 模态框内容区 (双栏布局) =========== */
.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* =========== 左侧栏：可选联系人 =========== */
.left-panel {
  width: 50%;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 15px 0;
}

.search-container {
  padding: 0 15px 15px 15px;
}

.search-input :deep(.el-input__wrapper) {
  background-color: var(--input-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  border: none !important;
}

.search-input :deep(.el-input__inner) {
  color: var(--font-color);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: var(--side-chat-hover-color);
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  margin-right: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
  color: white;
  font-size: 12px;
}

.checkbox.is-checked {
  background-color: #409eff;
  border-color: #409eff;
}

/* =========== 右侧栏：已选联系人 & 操作 =========== */
.right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color2); /* 稍微区分左右背景色 */
}

.right-header {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}


.selected-count {
  font-size: 13px;
  color: #909399;
}

.selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.selected-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background-color: var(--bg-color1);
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.selected-item:hover {
  background-color: var(--side-chat-hover-color);
}

.contact-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.small-avatar img {
  width: 35px;
  height: 35px;
}

.contact-info {
  flex: 1;
  margin-left: 12px;
  color: var(--font-color);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  color: #f56c6c;
  cursor: pointer;
  padding: 5px;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

.no-contacts, .no-selected {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-top: 40px;
}

/* =========== 底部操作区 =========== */
.right-footer {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color1);
}

.cancel-btn, .create-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: var(--bg-color2);
  color: var(--font-color);
}

.cancel-btn:hover {
  background-color: var(--side-chat-hover-color);
}

.create-btn {
  background-color: #409eff;
  color: white;
}

.create-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.create-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

/* 隐藏滚动条让视觉更干净 */
.contacts-list::-webkit-scrollbar,
.selected-list::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-thumb,
.selected-list::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}
</style>
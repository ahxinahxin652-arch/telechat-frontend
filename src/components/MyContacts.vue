<!-- MyContacts.vue -->
<script lang="ts">
import {defineComponent} from 'vue'
import {ElInput, ElMessage} from 'element-plus'
import {useUserStore} from '@/stores/user'
import {Search} from '@element-plus/icons-vue'
import {Message} from '@element-plus/icons-vue'
import {contactApplyApi} from "@/api/modules/contactApply";
import {contactApi} from "@/api/modules/contact";
import {useNotificationStore} from '@/stores/notification';


// 联系申请interface
interface ContactApply {
  id: number,
  username: string,
  avatar: string,
  nickname: string,
  status: string,
  createTime: string,
}

// 联系人interface
interface Contact {
  id: number,
  userId: number,
  username: string,
  nickname: string,
  avatar: string,
  remark: string
}

export default defineComponent({
  name: 'MyContacts',
  computed: {
    Search() {
      return Search
    }
  },
  components: {
    ElInput,
    Message
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'close', 'add-contact'],
  setup() {
    const notificationStore = useNotificationStore();
    return {
      notificationStore
    }
  },
  data() {
    return {
      userStore: useUserStore(),
      searchQuery: '',
      isSearching: false,
      isVisible: false,
      isSlidingOut: false,
      // 控制添加联系人弹窗的显示状态
      showAddContactModal: false,
      showContactApplyModal: false,
      // 表单数据
      newContactForm: {
        userName: '',
      },

      // 联系申请列表
      contactApplies: [] as ContactApply[],

      // 联系列表
      contacts: [] as Contact[],
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.isSlidingOut = false;
          this.$nextTick(() => {
            setTimeout(() => {
              this.isVisible = true;
            }, 0);
          });
          this.loadContacts();
          this.loadContactApplies();
        } else {
          this.startSlideOut();
        }
      }
    }
  },
  methods: {
    // 加载联系人列表
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

    // 加载添加联系人请求
    async loadContactApplies() {
      try {
        const response = await contactApplyApi.getApplyList();
        if (response.code === 200) {
          this.contactApplies = response.data;
        } else {
          ElMessage.error(response.msg);
        }
      } catch (error) {
        console.error('加载联系人申请失败:', error)
        ElMessage.error('加载联系人申请失败')
      }
    },

    startSlideOut() {
      this.isSlidingOut = true;
      this.isVisible = false;

      // 动画完成后触发关闭事件
      setTimeout(() => {
        this.$emit('update:modelValue', false);
        this.$emit('close');
      }, 300);
    },

    closeContacts() {
      this.startSlideOut()
    },

    closeContactsWithoutAnimation() {
      this.isSlidingOut = true;
      this.isVisible = false;
      this.$emit('update:modelValue', false);
      this.$emit('close');
    },

    // 联系人界面的 overlay 点击事件
    handleOverlayClickContacts(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.closeContacts()
      }
    },

    handleSearch() {
      // 搜索逻辑
      this.isSearching = true;
      // 这里可以添加搜索过滤逻辑
      setTimeout(() => {
        this.isSearching = false;
      }, 500);
    },

    // 打开申请联系人界面
    openContactsApply() {
      this.closeContactsWithoutAnimation(); // 先关闭联系人界面
      this.showContactApplyModal = true; // 显示申请联系人界面
      // 清除红点
      this.notificationStore.clearContactApply();
    },

    // 打开添加联系人弹窗
    addContact() {
      this.closeContactsWithoutAnimation(); // 先关闭联系人界面
      this.showAddContactModal = true; // 打开添加联系人弹窗
    },

    // 取消添加联系人
    cancelAddContact() {
      this.showAddContactModal = false;
      // 重新打开联系人界面
      this.$emit('update:modelValue', true);
      this.newContactForm.userName = '';
    },

    // 添加联系人
    async createContact() {
      if (!this.newContactForm.userName.trim()) {
        ElMessage.warning('userName is required');
        return;
      }

      const response = await contactApplyApi.addContactApply({
        userName: this.newContactForm.userName
      });

      if (response.code !== 200) {
        ElMessage.error(response.msg);
        return;
      }

      // 模拟创建成功
      ElMessage.success('Contact created successfully!');
      this.cancelAddContact(); // 关闭弹窗并返回联系人列表
      this.newContactForm.userName = '';
    },

    // 添加联系人界面的 overlay 点击事件
    handleOverlayClickAddContact(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.showAddContactModal = false;
        this.closeContacts();
        this.newContactForm.userName = '';
      }
    },

    // 关闭联系人申请窗口
    closeContactApply() {
      this.showContactApplyModal = false;
      this.$emit('update:modelValue', true);
    },

    // 同意联系人申请
    async acceptApply(applyId: number) {

      const res = await contactApplyApi.handleApply(
          {
            contactId: applyId,
            agree: true
          }
      );
      if (res.code === 200) {
        ElMessage.success('Contact added');
        await this.loadContacts();
        await this.loadContactApplies();
      } else {
        ElMessage.error(res.msg);
      }
    },

    // 拒绝联系人申请
    async rejectApply(applyId: number) {
      const res = await contactApplyApi.handleApply({
        contactId: applyId,
        agree: false
      });
      if (res.code === 200) {
        ElMessage.success('Request rejected');
        await this.loadContactApplies();
      } else {
        ElMessage.error(res.msg);
      }
    },

  }
})
</script>

<template>
  <div
      v-if="modelValue"
      class="contacts-overlay"
      :class="{ show: isVisible, hide: isSlidingOut }"
      @click="handleOverlayClickContacts"
  >
    <div
        class="contacts-modal"
        :class="{ 'slide-in': isVisible, 'slide-out': isSlidingOut }"
        @click.stop
    >
      <!--添加联系人请求-->
      <div class="contacts-header">
        <h2>Contacts</h2>
        <el-badge
            :value="notificationStore.contactApplyCount"
            :hidden="notificationStore.contactApplyCount === 0"
        >
          <el-icon class="close-btn" @click="openContactsApply">
            <Message/>
          </el-icon>
        </el-badge>
      </div>

      <div class="contacts-content">
        <!-- 搜索框 -->
        <div class="search-container">
          <el-input
              v-model="searchQuery"
              placeholder="Search"
              :prefix-icon="Search"
              class="search-input"
              @input="handleSearch"
          />
        </div>

        <!-- 联系人列表 -->
        <div class="contacts-list">
          <div v-if="contacts.length === 0 && !isSearching" class="no-contacts">
            No contacts found
          </div>
          <div v-else-if="isSearching" class="loading-placeholder">
            Searching...
          </div>
          <div v-else class="contact-item" v-for="contact in contacts" :key="contact.id">
            <div class="contact-avatar">
              <img :src="contact.avatar || 'src/assets/img/default_avatar.png' " alt="avatar" class="avatar-image"/>
            </div>
            <div class="contact-info">
              <div v-if="contact.remark == null " class="contact-name">{{ contact.nickname }}</div>
              <div v-else class="contact-remark">{{ contact.remark }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="contacts-footer">
        <button class="add-contact-btn" @click="addContact">Add Contact</button>
        <button class="foot-close-btn" @click="closeContacts">Close</button>
      </div>
    </div>
  </div>


  <!-- 添加联系人弹窗 -->
  <div
      v-if="showAddContactModal"
      class="contact-apply-modal-overlay"
      @click="handleOverlayClickAddContact"
  >
    <div class="add-contact-modal" @click.stop>
      <h3>New Contact</h3>

      <div class="form-group">
        <label>User name</label>
        <el-input class="new-contact-input" v-model="newContactForm.userName" placeholder="Enter username"/>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelAddContact">Cancel</button>
        <button class="create-btn" @click="createContact">Create</button>
      </div>
    </div>
  </div>

  <!-- 联系人申请窗口 -->
  <div
      v-if="showContactApplyModal"
      class="add-contact-modal-overlay"
      @click="closeContactApply"
  >
    <div class="add-contact-modal" @click.stop>
      <h3>Contact Requests</h3>

      <div class="contact-apply-list">
        <div
            v-if="contactApplies.length === 0"
            class="no-contacts"
        >
          No contact requests
        </div>

        <div
            v-else
            class="contact-apply-item"
            v-for="apply in contactApplies"
            :key="apply.id"
        >
          <div class="contact-avatar">
            <img
                :src="apply.avatar || 'src/assets/img/default_avatar.png'"
                alt="Avatar"
            />
          </div>
          <div class="apply-info">
            <div class="apply-name">
              {{ apply.nickname || apply.username }}
            </div>
          </div>

          <div class="apply-actions">
            <button class="accept-btn" @click="acceptApply(apply.id)">
              Accept
            </button>
            <button class="reject-btn" @click="rejectApply(apply.id)">
              Reject
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="closeContactApply">
          Close
        </button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.contacts-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0); /* 初始透明 */
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease; /* 透明度的过渡效果 */
}

.contacts-overlay.show {
  background-color: rgba(0, 0, 0, 0.5); /* 遮罩效果 */
}

/* 添加一个关闭时的透明度过渡 */
.contacts-overlay.hide {
  background-color: rgba(0, 0, 0, 0); /* 关闭时渐变到透明 */
}

.contacts-modal {
  background-color: var(--bg-color1);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transform: scale(0.7);
  opacity: 0;
  transition: all 0.3s ease;
}

.contacts-modal.slide-in {
  transform: scale(1);
  opacity: 1;
}

.contacts-modal.slide-out {
  transform: scale(0.7);
  opacity: 0;
}

.contacts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color1);
}

.contacts-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--font-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--font-color);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--side-chat-hover-color);
}

.contacts-content {
  padding: 20px;
  max-height: calc(90vh - 100px);
  overflow-y: auto;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  background-color: var(--input-color);
  border-radius: 8px;
  box-shadow: none;
  border: none;
  outline: none;
  min-height: 36px;
  padding: 0 12px;
}

.search-input :deep(.el-input__wrapper) {
  background-color: var(--input-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  border: none !important;
}

.search-input :deep(.el-input__inner) {
  background-color: var(--input-color) !important;
  color: var(--font-color);
  font-size: 14px;
  min-height: 36px;
  border: none;
  padding: 0 12px;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 10px;
  min-height: 300px;
  max-height: calc(90vh - 300px);
}

.contact-item {
  width: 100%;
  padding: 5px 10px;

  display: flex;
  flex-direction: row;
  align-items: center;

  cursor: pointer;
}

.contact-item:hover {
  background-color: var(--side-chat-hover-color);
}

.contact-avatar {
  display: flex;
}

.contact-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.contact-info {
  display: flex;
  margin-left: 20px;
}

.contacts-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.add-contact-btn {
  background-color: var(--bg-color1);
  border: none;
  color: var(--font-color);
  font-size: 15px;
  padding: 10px 20px;

  transition: all 0.2s ease;

  cursor: pointer;
}

.add-contact-btn:hover {
  background-color: var(--side-chat-hover-color);
}

.foot-close-btn {
  background-color: var(--bg-color1);
  border: none;
  color: var(--font-color);
  font-size: 15px;
  padding: 10px 20px;

  transition: all 0.2s ease;

  cursor: pointer;
}

.foot-close-btn:hover {
  background-color: var(--side-chat-hover-color);
}

/*                 添加联系人弹窗                   */
.add-contact-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-contact-modal {
  background-color: var(--bg-color1);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.add-contact-modal h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--font-color);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 14px;
  color: var(--font-color);
}

.new-contact-input {
  outline: none;
  flex: 1;
}

.new-contact-input :deep(.el-input__wrapper) {
  border: none;
  background-color: var(--bg-color1) !important;
}

.new-contact-input :deep(.el-input__inner) {
  outline: none;
  border: none;
  box-shadow: none;
  background-color: var(--bg-color1);
  resize: none;
  padding: 0;
  min-height: 35px !important;
  color: white;
}

/* 添加这一部分确保聚焦时也没有边框 */
.new-contact-input :deep(.el-input__inner:focus) {
  outline: none;
  border: none;
  box-shadow: none;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cancel-btn,
.create-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: var(--bg-color1);
  color: var(--font-color);
}

.cancel-btn:hover {
  background-color: var(--side-chat-hover-color);
}

.create-btn {
  background-color: #409eff;
  color: white;
}

.create-btn:hover {
  background-color: #66b1ff;
}

/*                 联系人申请窗口                       */
.contact-apply-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.contact-apply-list {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  min-height: 300px;
  overflow-y: auto;
}

.contact-apply-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 8px 4px;
  border-radius: 8px;
}

.contact-apply-item:hover {
  background-color: var(--side-chat-hover-color);
}

.apply-info {
  flex: 1;
}

.apply-name {
  color: var(--font-color);
  font-size: 14px;
}

.apply-actions {
  display: flex;
  gap: 8px;
}

.accept-btn {
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}

.reject-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}
</style>
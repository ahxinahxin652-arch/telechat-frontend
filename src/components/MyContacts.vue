<script lang="ts">
import {defineComponent} from 'vue'
import {ElInput, ElMessage} from 'element-plus'
import {useUserStore} from '@/stores/user'
import {Search, Message, ArrowLeft} from '@element-plus/icons-vue' // 引入 ArrowLeft 返回图标
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
    Message,
    ArrowLeft // 注册 ArrowLeft 图标
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

      // 弹窗控制
      showAddContactModal: false,
      showContactApplyModal: false,
      showContactDetailsModal: false, // 控制联系人详情面板

      // 当前选中的联系人（用于展示详情）
      selectedContact: null as Contact | null,

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
      setTimeout(() => {
        this.$emit('update:modelValue', false);
        this.$emit('close');
        // 关闭主窗口时重置详情状态
        this.showContactDetailsModal = false;
      }, 300);
    },

    closeContacts() {
      this.startSlideOut()
    },

    closeContactsWithoutAnimation() {
      this.isSlidingOut = true;
      this.isVisible = false;
      this.showContactDetailsModal = false;
      this.$emit('update:modelValue', false);
      this.$emit('close');
    },

    handleOverlayClickContacts(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.closeContacts()
      }
    },

    handleSearch() {
      this.isSearching = true;
      setTimeout(() => {
        this.isSearching = false;
      }, 500);
    },

    openContactsApply() {
      this.closeContactsWithoutAnimation();
      this.showContactApplyModal = true;
      this.notificationStore.clearContactApply();
    },

    addContact() {
      this.closeContactsWithoutAnimation();
      this.showAddContactModal = true;
    },

    cancelAddContact() {
      this.showAddContactModal = false;
      this.$emit('update:modelValue', true);
      this.newContactForm.userName = '';
    },

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
      ElMessage.success('Contact request sent successfully!');
      this.cancelAddContact();
      this.newContactForm.userName = '';
    },

    handleOverlayClickAddContact(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.showAddContactModal = false;
        this.closeContacts();
        this.newContactForm.userName = '';
      }
    },

    closeContactApply() {
      this.showContactApplyModal = false;
      this.$emit('update:modelValue', true);
    },

    async acceptApply(applyId: number) {
      const res = await contactApplyApi.handleApply({
        contactId: applyId,
        agree: true
      });
      if (res.code === 200) {
        ElMessage.success('Contact added');
        await this.loadContacts();
        await this.loadContactApplies();
      } else {
        ElMessage.error(res.msg);
      }
    },

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

    // --- 详情视图操作 ---
    openContactDetails(contact: Contact) {
      this.selectedContact = contact;
      this.showContactDetailsModal = true;
    },

    closeContactDetails() {
      this.showContactDetailsModal = false;
      // 延迟清空数据，等待划出动画执行完毕
      setTimeout(() => {
        this.selectedContact = null;
      }, 300);
    },

    sendMessageToContact() {
      ElMessage.success(`Redirecting to chat with ${this.selectedContact?.nickname || this.selectedContact?.username}...`);
      this.closeContactDetails();
      this.closeContacts();
    }
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
      <div class="contacts-view-layer">
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
          <div class="search-container">
            <el-input
                v-model="searchQuery"
                placeholder="Search"
                :prefix-icon="Search"
                class="search-input"
                @input="handleSearch"
            />
          </div>

          <div class="contacts-list">
            <div v-if="contacts.length === 0 && !isSearching" class="no-contacts">
              No contacts found
            </div>
            <div v-else-if="isSearching" class="loading-placeholder">
              Searching...
            </div>
            <div
                v-else
                class="contact-item"
                v-for="contact in contacts"
                :key="contact.id"
                @click="openContactDetails(contact)"
            >
              <div class="contact-avatar">
                <img :src="contact.avatar || 'src/assets/img/default_avatar.png' " alt="avatar" class="avatar-image"/>
              </div>
              <div class="contact-info">
                <div v-if="contact.remark == null || contact.remark === '' " class="contact-name">{{
                    contact.nickname
                  }}
                </div>
                <div v-else class="contact-remark">{{ contact.remark }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="contacts-footer">
          <button class="add-contact-btn" @click="addContact">Add Contact</button>
          <button class="foot-close-btn" @click="closeContacts">Close</button>
        </div>
      </div>

      <transition name="slide-panel">
        <div class="contact-details-layer" v-if="showContactDetailsModal">

          <div class="contact-header">
            <el-icon class="back-btn" @click="closeContactDetails">
              <ArrowLeft/>
            </el-icon>
          </div>

          <div class="details-scroll-content" v-if="selectedContact">
            <div class="details-avatar">
              <img :src="selectedContact.avatar || 'src/assets/img/default_avatar.png'" alt="avatar"/>
            </div>

            <div class="details-info">
              <div class="details-nickname">{{ selectedContact.remark || selectedContact.nickname }}</div>
              <div class="details-username">@{{ selectedContact.username }}</div>
            </div>
            <!--操作-->
            <div class="details-actions">
              <!--message-->
              <div class="action-button">
                <div class="action-icon">

                </div>
                <div class="action-font">
                  Message
                </div>
              </div>
              <!--mute-->
              <div class="action-button">
                <div class="action-icon">

                </div>
                <div class="action-font">
                  Mute
                </div>
              </div>
              <!--call-->
              <div class="action-button">
                <div class="action-icon">

                </div>
                <div class="action-font">
                  Call
                </div>
              </div>
              <!--more-->
              <div class="action-button">
                <div class="action-icon">

                </div>
                <div class="action-font">
                  More
                </div>
              </div>
            </div>

            <!--remark与bio-->
            <div class="details-full-info">
              <div class="person-info">
              <div>remark</div>
                daddad
              </div>
              <div class="person-info">
                <div>Bio</div>
                daddad
              </div>
            </div>

            <!--共同群聊-->
            <div class="details-full-info">
              <div class="full-info">
              1 group in common
              </div>
            </div>

            <!--operate-->
            <div class="details-full-info">
              <div class="full-info">
                Delete Contact
              </div>
              <div class="full-info">
                Block Contact
              </div>
            </div>
          </div>

        </div>
      </transition>

    </div>
  </div>

  <!--申请联系界面  -->
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

  <!--联系申请处理界面  -->
  <div
      v-if="showContactApplyModal"
      class="add-contact-modal-overlay"
      @click="closeContactApply"
  >
    <div class="add-contact-modal" @click.stop>
      <h3>Contact Requests</h3>
      <div class="contact-apply-list">
        <div v-if="contactApplies.length === 0" class="no-contacts">
          No contact requests
        </div>
        <div v-else class="contact-apply-item" v-for="apply in contactApplies" :key="apply.id">
          <div class="contact-avatar">
            <img :src="apply.avatar || 'src/assets/img/default_avatar.png'" alt="Avatar"/>
          </div>
          <div class="apply-info">
            <div class="apply-name">{{ apply.nickname || apply.username }}</div>
          </div>
          <div class="apply-actions">
            <button class="accept-btn" @click="acceptApply(apply.id)">Accept</button>
            <button class="reject-btn" @click="rejectApply(apply.id)">Reject</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeContactApply">Close</button>
      </div>
    </div>
  </div>

</template>

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

/* =========== 主体模态框（包含列表与详情） =========== */
.contacts-modal {
  /* 优化：为了保证内部推入动画正常，设置 position: relative 和 overflow: hidden */
  position: relative;
  background-color: var(--bg-color1);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  min-height: 500px; /* 增加最小高度：防止详情内容挤压 */
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transform: scale(0.7);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.3s ease;
}

.contacts-modal.slide-in {
  transform: scale(1);
  opacity: 1;
}

.contacts-modal.slide-out {
  transform: scale(0.7);
  opacity: 0;
}

/* 列表容器，撑满整个Modal */
.contacts-view-layer {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
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
  flex: 1;
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
}

.contact-item {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: var(--side-chat-hover-color);
}

.contact-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-info {
  display: flex;
  margin-left: 15px;
  color: var(--font-color);
  font-size: 15px;
  font-weight: 500;
}

.contacts-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 5px; /* 添加一点内边距以美化边距 */
}

.add-contact-btn, .foot-close-btn {
  background-color: transparent;
  border: none;
  color: var(--font-color);
  font-size: 15px;
  padding: 10px 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  border-radius: 8px;
}

.add-contact-btn:hover, .foot-close-btn:hover {
  background-color: var(--side-chat-hover-color);
}

/* =========== 详情图层 (覆盖在列表上的抽屉) =========== */
.contact-details-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color3);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

/* 进出场滑动动画 */
.slide-panel-enter-active, .slide-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-panel-enter-from, .slide-panel-leave-to {
  transform: translateX(100%);
}

.slide-panel-enter-to, .slide-panel-leave-from {
  transform: translateX(0);
}

.contact-header {
  justify-content: space-between;
  background-color: var(--bg-color3);
  padding: 0;
}

.back-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--font-color);
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: var(--side-chat-hover-color);
}

.header-placeholder {
  width: 30px; /* 与左侧 back-btn 保持一致，使标题居中 */
}

.details-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.details-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.details-info {
  text-align: center;
  margin-top: 5px;
}

.details-nickname {
  font-size: 18px;
  font-weight: 600;
  color: var(--font-color);
  margin-bottom: 6px;
}

.details-username {
  font-size: 14px;
  color: #909399;
}
/*操作*/
.details-actions {
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-content: space-between;

  padding: 0 20px;
  gap: 12px;
  margin-top: 15px;
}

.action-button{
  width: 24%;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 8px;

  background-color: var(--bg-color1);

  cursor: pointer;
}

.action-icon{
  width: 80%;
}

.action-font{
  display: flex;
  justify-content: center;
  font-size: 14px;
}

/*remark & bio*/
/*common groups*/
/*operate*/
.details-full-info{
  width: 100%;
  background-color: var(--bg-color1);
  margin-top: 10px;

  display: flex;
  flex-direction: column;
}

.person-info{
  width: 100%;
  padding: 10px 10px;

  display: flex;
  flex-direction: column;
}

.full-info{
  width: 100%;

  display: flex;
  flex-direction: row;
  padding: 10px 10px;
}


/* 隐藏滚动条让视觉更干净 (仅 Webkit) */
.details-scroll-content::-webkit-scrollbar,
.contacts-content::-webkit-scrollbar {
  width: 6px;
}

.details-scroll-content::-webkit-scrollbar-thumb,
.contacts-content::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

/* =========== 其他弹窗样式（申请/添加联系人，保持原样即可） =========== */
.add-contact-modal-overlay, .contact-apply-modal-overlay {
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
  color: var(--font-color);
}

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

.cancel-btn, .create-btn {
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
<!-- Profile.vue -->
<script lang="ts">
import {defineComponent} from 'vue'
import {ElInput, ElMessage, ElOption, ElSelect,} from 'element-plus'
import type {Profile} from '@/stores/user'
import {useUserStore} from '@/stores/user'
import {Camera, Female, Male} from '@element-plus/icons-vue'

export default defineComponent({
  name: 'ProfileView',
  components: {
    Camera,
    Male,
    Female,
    ElInput,
    ElSelect,
    ElOption,
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
      profile: {
        username: '',
        nickname: '',
        avatar: '',
        gender: 0,
        bio: '',
        createTime: '',
        updateTime: '',
        lastLoginTime: ''
      } as Profile,
      isEditing: false,
      editProfile: {
        nickname: '',
        gender: 0,
        bio: ''
      },
      userStore: useUserStore(),
      isUploading: false,
      isVisible: false,     // 控制显示状态
      isSlidingOut: false   // 控制滑出动画
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // 显示时从中间弹出
          this.isSlidingOut = false;
          this.$nextTick(() => {
            setTimeout(() => {
              this.isVisible = true;
            }, 0);
          });
          this.loadProfile()
        } else {
          this.startSlideOut();
        }
      }
    }
  },
  methods: {
    loadProfile() {
      try {
        const userInfo = this.userStore.getProfile
        if (userInfo) {
          this.profile = { ...userInfo }
          this.editProfile = {
            nickname: userInfo.nickname,
            gender: userInfo.gender,
            bio: userInfo.bio
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        ElMessage.error('加载用户信息失败')
      }
    },
    startSlideOut() {
      this.isSlidingOut = true;
      this.isVisible = false;

      // 动画完成后触发关闭事件
      setTimeout(() => {
        this.$emit('update:modelValue', false);
        this.$emit('close');
      }, 300); // 动画时间应该与 CSS 动画时长一致
    },
    closeProfile() {
      this.startSlideOut()
      // 关闭编辑状态
      this.isEditing = false
    },

    handleOverlayClick(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.closeProfile()
      }
    },

    startEdit() {
      this.isEditing = true
      this.editProfile = {
        nickname: this.profile.nickname,
        gender: this.profile.gender,
        bio: this.profile.bio
      }
    },

    cancelEdit() {
      this.isEditing = false
    },

    saveEdit() {
      // 更新本地数据
      this.profile.nickname = this.editProfile.nickname
      this.profile.gender = this.editProfile.gender
      this.profile.bio = this.editProfile.bio

      // 更新 store
      this.userStore.setProfile({ ...this.profile })
      this.isEditing = false
    },

    async handleAvatarUpload(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]

      if (file) {
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif']
        if (!validTypes.includes(file.type)) {
          ElMessage.error('请上传 JPG、PNG 或 GIF 格式的图片')
          return
        }

        // 验证文件大小 (最大 10MB)
        if (file.size > 10 * 1024 * 1024) {
          ElMessage.error('图片大小不能超过 2MB')
          return
        }

        this.isUploading = true;

        try {
          // 上传到服务器
          // 更新本地预览（使用服务器返回的URL）
          this.profile.avatar = await this.userStore.uploadAvatar(file);

          // 如果当前在编辑状态，也更新编辑数据
          if (this.isEditing) {
            // 编辑状态下不需要额外操作，因为保存时会更新整个profile
          }

          ElMessage.success('头像上传成功')
        } catch (error) {
          console.error('头像上传失败:', error)
          ElMessage.error('头像上传失败')
        } finally {
          this.isUploading = false;
          // 清空input，允许重复选择同一文件
          input.value = '';
        }
      }
    },

    triggerFileSelect() {
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
      fileInput?.click()
    }
  }
})
</script>

<!-- Profile.vue -->
<template>
  <div
      v-if="modelValue"
      class="profile-overlay"
      :class="{show:isVisible,hide: isSlidingOut}"
      @click="handleOverlayClick"
  >
    <div
        class="profile-modal"
        :class="{ 'slide-in': isVisible, 'slide-out': isSlidingOut }"
        @click.stop
    >
      <div class="profile-header">
        <h2>个人信息</h2>
        <button class="close-btn" @click="closeProfile">×</button>
      </div>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-wrapper" @click="triggerFileSelect">
            <img
                :src="profile.avatar || '/default-avatar.png'"
                :alt="profile.nickname"
                class="avatar-image"
            >
            <div class="avatar-overlay">
              <Camera class="camera-icon" />
            </div>
            <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                class="avatar-input"
                @change="handleAvatarUpload"
                :disabled="isUploading"
            >
          </div>
          <div class="username">{{ profile.username }}</div>
        </div>

        <!-- 用户信息 -->
        <div class="profile-info">
          <!-- 昵称 -->
          <div class="info-item">
            <span class="label">昵称</span>
            <div v-if="!isEditing" class="value bio-value">{{ profile.nickname }}</div>
            <el-input
                v-else
                v-model="editProfile.nickname"
                class="edit-input"
                placeholder="请输入昵称"
            />
          </div>

          <!-- 性别 -->
          <div class="info-item">
            <span class="label">性别</span>
            <div v-if="!isEditing" class="value">
              <div v-if="profile.gender === 1" class="gender-display">
                <Male class="gender-icon male" />
                <span>男</span>
              </div>
              <div v-else-if="profile.gender === 2" class="gender-display">
                <Female class="gender-icon female" />
                <span>女</span>
              </div>
              <div v-else class="gender-display">
                <span>未设置</span>
              </div>
            </div>
            <el-select
                v-else
                v-model="editProfile.gender"
                class="edit-select"
                placeholder="请选择性别"
            >
              <el-option :value="0" label="未设置" />
              <el-option :value="1" label="男" />
              <el-option :value="2" label="女" />
            </el-select>
          </div>

          <!-- 个人简介 -->
          <div class="info-item bio-item">
            <span class="label">个人简介</span>
            <div v-if="!isEditing" class="value bio-value">{{ profile.bio || '未设置' }}</div>
            <el-input
                v-else
                v-model="editProfile.bio"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 3 }"
                class="edit-textarea"
                placeholder="请输入个人简介"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="profile-actions">
          <div v-if="!isEditing" class="action-buttons">
            <el-button type="primary" @click="startEdit">编辑</el-button>
          </div>
          <div v-else class="action-buttons">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveEdit">保存</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-overlay {
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

.profile-overlay.show {
  background-color: rgba(0, 0, 0, 0.5); /* 遮罩效果 */
}

/* 添加一个关闭时的透明度过渡 */
.profile-overlay.hide {
  background-color: rgba(0, 0, 0, 0); /* 关闭时渐变到透明 */
}

.profile-modal {
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

.profile-modal.slide-in {
  transform: scale(1);
  opacity: 1;
}

.profile-modal.slide-out {
  transform: scale(0.7);
  opacity: 0;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color1);
}

.profile-header h2 {
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

.profile-content {
  padding: 20px;
  max-height: calc(90vh - 70px);
  overflow-y: auto;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.camera-icon {
  width: 30px;
  height: 30px;
  color: white;
}

.avatar-input {
  display: none;
}

.username {
  font-size: 14px;
  color: var(--font-color);
}

.profile-info {
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.label {
  width: 80px;
  font-size: 14px;
  color: var(--font-color);
  flex-shrink: 0;
  margin-right: 20px;
  display: flex;
  align-items: center;
  min-height: 36px;
}

.value {
  flex: 1;
  font-size: 14px;
  color: var(--font-color);
  word-break: break-word;
  min-height: 36px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: none;
  padding: 0 12px;
}

.bio-value {
  white-space: pre-wrap;
}

/* Element Plus 组件样式调整 */
:deep(.edit-input .el-input__wrapper),
:deep(.edit-select .el-select__wrapper) {
  background-color: var(--input-color);
  border-radius: 8px;
  box-shadow: none;
  border: none;
  outline: none;
  min-height: 36px;
  padding: 0 12px;
}

:deep(.edit-input .el-input__inner),
:deep(.edit-select .el-select__inner) {
  background-color: var(--input-color);
  color: var(--font-color);
  font-size: 14px;
  min-height: 36px;
  border: none;
}


:deep(.edit-textarea .el-textarea__inner) {
  background-color: var(--input-color);
  border-radius: 8px;
  box-shadow: none;
  border: none;
  outline: none;
  color: var(--font-color);
  font-size: 14px;
  padding: 8px 12px;
}

.gender-display {
  display: flex;
  align-items: center;
  gap: 5px;
}

.gender-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.male {
  color: #409eff;
}

.female {
  color: #ff69b4;
}

.profile-actions {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

:deep(.el-button){
  background-color: var(--button-color);
  border-color: var(--border-color);
  color: var(--font-color);
  border-radius: 6px; /* 与项目中其他按钮保持一致 */
}

:deep(.el-button:hover) {
  background-color: var(--button-hover-color);
  border-color: var(--border-color);
}

/* 滚动条样式 */
.profile-content::-webkit-scrollbar {
  width: 6px;
}

.profile-content::-webkit-scrollbar-track {
  background: var(--bg-color2);
  border: none;
  outline: none;
  border-radius: 3px;
}

.profile-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border: none;
  outline: none;
  border-radius: 3px;
}

.profile-content::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>

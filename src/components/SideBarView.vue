<template>
  <div v-if="modelValue"
       class="sidebar-overlay"
       :class="{show:isVisible,hide: isSlidingOut}"
       @click="closeSidebar">
    <div
        class="sidebar-view"
        :class="{ 'slide-in': isVisible, 'slide-out': isSlidingOut }"
        @click.stop
    >
      <div class="sidebar-header">
        <!-- 用户信息区域 -->
        <div class="user-info" v-if="userProfile">
          <div class="avatar-container">
            <img :src="userProfile.avatar" :alt="userProfile.nickname" class="user-avatar">
          </div>
          <div class="user-details">
            <div class="nickname">{{ userProfile.nickname }}</div>
            <div class="username">设置当前状态</div>
          </div>
        </div>
      </div>

      <div class="sidebar-menu">
        <div class="menu-item" style="border-bottom: 1px solid var(--border-color);" @click="goToProfile">
          <el-icon class="menu-icon">
            <User/>
          </el-icon>
          <span>个人信息</span>
        </div>

        <div class="menu-item" @click="createNewGroup">
          <el-icon class="menu-icon">
            <ChatSquare/>
          </el-icon>
          <span>创建新群聊</span>
        </div>

        <div class="menu-item" @click="createNewChannel">
          <el-icon class="menu-icon">
            <Phone/>
          </el-icon>
          <span>创建新频道</span>
        </div>

        <div class="menu-item" @click="goToMyContacts">
          <el-icon class="menu-icon">
            <User/>
          </el-icon>
          <span>我的好友</span>
        </div>

        <div class="menu-item" @click="goToSettings">
          <el-icon class="menu-icon">
            <Setting/>
          </el-icon>
          <span>设置</span>
        </div>

        <div class="menu-item" @click="logout">
          <el-icon class="menu-icon">
            <SwitchButton/>
          </el-icon>
          <span>退出登录</span>
        </div>

        <!-- 主题切换选项 -->
        <div class="menu-item theme-toggle-item">
          <el-icon class="menu-icon">
            <Moon/>
          </el-icon>
          <span>黑夜模式</span>
          <el-switch
              class="theme-switch"
              :model-value="isDarkThemeLocal"
              @change="toggleTheme"
              size="default"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
/* 导入组件 */
import {defineComponent} from 'vue'
import {
  User,
  Setting,
  SwitchButton,
  Moon,    // 暗黑模式图标
  ChatSquare,
  Phone,
} from '@element-plus/icons-vue'
import themeManager from '@/utils/themeManager'
import {useUserStore} from "@/stores/user";
import {ElMessage, ElMessageBox} from "element-plus";
import router from "@/router";

export default defineComponent({
  name: 'SideBarView',
  components: {
    User,
    ChatSquare,
    Phone,
    Setting,
    SwitchButton,
    Moon    // 暗黑模式图标
  },
  // 接收父组件传递的属性
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  // 数据
  data() {
    return {
      // 控制显示隐藏
      isVisible: false,
      isSlidingOut: false,

      // 添加响应式数据来跟踪主题
      isDarkThemeLocal: themeManager.getCurrentTheme() === 'dark',

      userStore: useUserStore(), // 获取用户store实例
    }
  },
  // 计算属性
  computed: {
    // 计算属性获取用户信息
    userProfile() {
      return this.userStore.getProfile;
    }
  },
  // 用于向父组件发送事件
  emits: ['update:modelValue', 'close', 'profile', 'create-group', 'create-channel', 'my-contacts', 'settings', 'logout'],
  // 监听 modelValue 属性
  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // 显示侧边栏时获取用户信息
          this.fetchUserProfile();

          // 显示时从左边滑入
          this.isSlidingOut = false;
          this.$nextTick(() => {
            setTimeout(() => {
              this.isVisible = true;
            }, 0); // 点击后多少秒执行动画
          });
        } else {
          this.startSlideOut();
        }
      }
    }
  },
  // 方法
  methods: {
    // 开始滑出动画
    startSlideOut() {
      this.isSlidingOut = true;
      this.isVisible = false;

      // 动画完成后触发关闭事件
      setTimeout(() => {
        this.$emit('update:modelValue', false);
        this.$emit('close');
      }, 300); // 动画时间应该与 CSS 动画时长一致
    },

    // 关闭侧边栏
    closeSidebar() {
      this.startSlideOut()
    },

    // 获取用户信息
    async fetchUserProfile() {
      // 调试：检查 token 是否存在
      const token = localStorage.getItem('token');
      console.log('Fetching profile, token:', token);
      try {
        await this.userStore.fetchProfile();
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 可以在这里添加错误提示
      }
    },

    // 跳转到个人信息
    goToProfile() {
      this.$emit('profile')
      this.startSlideOut()
    },

    // 创建新群聊
    createNewGroup() {
      this.$emit('create-group')
      this.startSlideOut()
    },

    // 创建新频道
    createNewChannel() {
      this.$emit('create-channel')
      this.startSlideOut()
    },

    // 我的联系人
    goToMyContacts() {
      this.$emit('my-contacts')
      this.startSlideOut()
    },

    // 跳转到设置
    goToSettings() {
      this.$emit('settings')
      this.startSlideOut()
    },

    // 主题切换
    toggleTheme() {
      themeManager.toggleTheme();
      // 更新组件内的响应式数据
      this.isDarkThemeLocal = themeManager.getCurrentTheme() === 'dark';
    },

    // 退出登录
    async logout() {
      try {
        await ElMessageBox.confirm(
            '确定要退出登录吗？',
            '退出登录',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
        )

        // 清除缓存数据
        this.userStore.clearProfile();

        // 清除本地存储的token
        localStorage.removeItem('token')

        // 发送退出登录事件
        this.$emit('logout')

        // 跳转到登录页
        await router.push('/login')

        ElMessage.success('退出登录成功')
      } catch (error) {
        // 用户取消操作
        console.log('用户取消退出登录')
      }
    }
  }
})
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0); /* 初始透明 */
  z-index: 1000;
  display: flex;
  transition: background-color 0.5s ease; /* 透明度的过渡效果 */
}

.sidebar-overlay.show {
  background-color: rgba(0, 0, 0, 0.5); /* 遮罩效果 */
}

/* 添加一个关闭时的透明度过渡 */
.sidebar-overlay.hide {
  background-color: rgba(0, 0, 0, 0); /* 关闭时渐变到透明 */
}

.sidebar-view {
  width: 260px;
  height: 100vh;
  background-color: var(--bg-color1);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: relative;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.sidebar-view.slide-in {
  transform: translateX(0);
}

.sidebar-view.slide-out {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color1);
}

/*                                                添加用户信息样式(头像信息等)                                */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: var(--bg-color1);
}

.avatar-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  margin-bottom: 15px;

}

.user-avatar {
  width: 100%;
  height: 100%;
  cursor: pointer;

  object-fit: fill;
  background-color: var(--bg-color1);
}

.user-details {
  flex: 1;
}

.nickname {
  font-weight: normal;
  color: var(--font-color);
  font-size: 14px;
  cursor: pointer;
}

.username {
  font-weight: normal;
  color: var(--font-color);
  text-decoration: underline;
  font-size: 14px;
}

.close-btn :deep(.el-icon) {
  color: var(--font-color) !important;
  width: 16px;
  height: 16px;
}

.sidebar-menu {
  flex: 1;
  background-color: var(--bg-color1);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--side-chat-hover-color);
}

.theme-toggle-item {
  justify-content: space-between;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 15px;
  color: var(--font-color);
}

.menu-item span {
  color: var(--font-color);
  font-size: 14px;
  flex: 1;
}

.theme-switch {
  margin-left: auto;
}

/* 添加遮罩层显示效果 */
.sidebar-overlay.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>

<template>
  <div class="login-container">
    <div class="login-form">
      <h2>用户登录</h2>
      <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          label-width="80px"
          @keyup.enter="handleLogin"
      >
        <el-form-item label="登录方式" prop="identifyType">
          <el-select
              v-model="loginForm.identifyType"
              placeholder="请选择登录方式"              style="width: 100%"
          >
            <el-option label="邮箱" value="email"></el-option>
            <el-option label="手机号" value="phone"></el-option>
            <el-option label="用户名" value="username"></el-option>
          </el-select>
        </el-form-item>


        <el-form-item label="账号" prop="identifier">
          <el-input
              v-model="loginForm.identifier"
              :placeholder="identifierPlaceholder"
              clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="verifyCode">
          <el-row :gutter="10">
            <el-col :span="16">
              <el-input
                  v-model="loginForm.verifyCode"
                  placeholder="请输入验证码"
                  maxlength="6"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="8">
              <el-button
                  @click="getVerifyCode"
                  :disabled="isCountingDown"
                  style="width: 100%"
              >
                {{ countDownText }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"              style="width: 100%"
              @click="handleLogin"
              :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-link type="primary" @click="router.push('/register')">
            没有账户？立即注册
          </el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import { User, Key } from '@element-plus/icons-vue'
import { LoginRequest, VerifyCodeRequest } from '@/api/types/userAuths' // 修复导入
import { userApi } from '@/api'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

interface LoginForm {
  identifyType: string
  identifier: string
  verifyCode: string
}

export default defineComponent({
  name: 'LoginView',
  methods: {

  },
  components: {
    User,
    Key
  },
  setup() {
    const router = useRouter() // 在 setup 中获取 router 实例

    // 表单数据
    const loginForm = reactive<LoginForm>({
      identifyType: 'email',
      identifier: '',
      verifyCode: ''
    })

    // 表单引用
    const formRef = ref<InstanceType<typeof ElForm>>()

    // 加载状态
    const loading = ref(false)

    // 倒计时相关
    const countDown = ref(0)
    const isCountingDown = computed(() => countDown.value > 0)
    const countDownText = computed(() =>
        isCountingDown.value ? `${countDown.value}秒后重发` : '获取验证码'
    )

    // 根据登录方式显示不同placeholder
    const identifierPlaceholder = computed(() => {
      switch (loginForm.identifyType) {
        case 'email': return '请输入邮箱地址'
        case 'phone': return '请输入手机号码'
        case 'username': return '请输入用户名'
        default: return '请输入账号'
      }
    })

    // 验证规则
    const rules = {
      identifyType: [
        { required: true, message: '请选择登录方式', trigger: 'change' }
      ],
      identifier: [
        { required: true, message: '请输入账号', trigger: 'blur' }
      ],
      verifyCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
      ]
    }

    // 获取验证码
    const getVerifyCode = async () => {
      if (!loginForm.identifier) {
        ElMessage.warning('请先输入账号')
        return
      }

      if (countDown.value > 0) return

      try {
        const verifyCodeData: VerifyCodeRequest = { // 修复类型
          type: 2,
          identifyType: loginForm.identifyType,
          identifier: loginForm.identifier
        }

        // 开始60秒倒计时
        countDown.value = 60
        const timer = setInterval(async () => {
          countDown.value--
          if (countDown.value <= 0) {
            clearInterval(timer)
          }
        }, 1000)
        // 调用获取验证码接口
        const response =await userApi.getVerifyCode(verifyCodeData);
        if (response && response.code === 200 ) {
          ElMessage.success(response.msg || '验证码已发送，请注意查收')
        } else {
          ElMessage.error(response.msg || '获取验证码失败')
          countDown.value = 0
        }

      } catch (error: any) {
        ElMessage.error(error.message || '获取验证码失败')
        // 重置倒计时以便重新获取
        countDown.value = 0
      }
    }

    // 登录处理
    const handleLogin = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          try {
            // 构造登录请求数据
            const loginData: LoginRequest = {
              identifyType: loginForm.identifyType,
              identifier: loginForm.identifier,
              verifyCode: loginForm.verifyCode
            }

            // 调用登录API
            const response = await userApi.login(loginData)
            if (response &&response.code === 200) {
              // 保存token
              localStorage.setItem('token', response.data.token)
              // 保存登录信息
              useUserStore().saveProfileToState(response.data.profile);
              // 登录成功
              ElMessage.success('登录成功')
              // 跳转到首页
              await router.push('/home')
            } else {
              ElMessage.error(response.msg || '登录失败')
            }
          } catch (error: any) {
            ElMessage.error(error.message || '登录失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      loginForm,
      formRef,
      loading,
      rules,
      handleLogin,
      getVerifyCode,
      identifierPlaceholder,
      isCountingDown,
      countDownText,
      router
    }
  }
})
</script>

<style scoped>.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  width: 450px;
  padding: 30px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
</style>
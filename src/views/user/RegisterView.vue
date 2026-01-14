<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      <el-form
          ref="formRef"
          :model="registerForm"
          :rules="rules"
          label-width="80px"
          @keyup.enter="handleRegister"
      >
        <el-form-item label="注册方式" prop="identifyType">
          <el-select
              v-model="registerForm.identifyType"
              placeholder="请选择注册方式"              style="width: 100%"
          >
            <el-option label="邮箱" value="email"></el-option>
            <el-option label="手机号" value="phone"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="账号" prop="identifier">
          <el-input
              v-model="registerForm.identifier"
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
                  v-model="registerForm.verifyCode"
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
                  :disabled="isCountingDown"                  style="width: 100%"
              >
                {{ countDownText }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"              style="width: 100%"
              @click="handleRegister"
              :loading="loading"
          >
            注册
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-link type="primary" @click="router.push('/login')">
            已有账户？立即登录
          </el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">import { defineComponent, reactive, ref, computed } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import { User, Key, Lock } from '@element-plus/icons-vue'
import { RegisterRequest, VerifyCodeRequest } from '@/api/types/userAuths'
import { userApi } from '@/api'
import { useRouter } from 'vue-router'

interface RegisterForm {
  identifyType: string
  identifier: string
  verifyCode: string
  password: string
  confirmPassword: string
}

export default defineComponent({
  name: 'RegisterView',
  components: {
    User,
    Key,
    Lock
  },
  setup() {
    const router = useRouter()

    // 表单数据
    const registerForm = reactive<RegisterForm>({
      identifyType: 'email',
      identifier: '',
      verifyCode: '',
      password: '',
      confirmPassword: ''
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

    // 根据注册方式显示不同placeholder
    const identifierPlaceholder = computed(() => {
      switch (registerForm.identifyType) {
        case 'email': return '请输入邮箱地址'
        case 'phone': return '请输入手机号码'
        default: return '请输入账号'
      }
    })

    // 验证规则
    const rules = {
      identifyType: [
        { required: true, message: '请选择注册方式', trigger: 'change' }
      ],
      identifier: [
        { required: true, message: '请输入账号', trigger: 'blur' }
      ],
      verifyCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在6到20个字符之间', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
          validator: (rule: any, value: string, callback: any) => {
            if (value !== registerForm.password) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    // 获取验证码
    const getVerifyCode = async () => {
      if (!registerForm.identifier) {
        ElMessage.warning('请先输入账号')
        return
      }

      if (countDown.value > 0) return

      try {
        const verifyCodeData: VerifyCodeRequest = {
          type: 1, // 注册类型验证码
          identifyType: registerForm.identifyType,
          identifier: registerForm.identifier
        }

        // 调用获取验证码接口
        const response = await userApi.getVerifyCode(verifyCodeData)

        // 处理返回结果
        if (response && (response.code === 200 || response.success === true)) {
          ElMessage.success(response.message || '验证码已发送，请注意查收')

          // 开始60秒倒计时
          countDown.value = 60
          const timer = setInterval(() => {
            countDown.value--
            if (countDown.value <= 0) {
              clearInterval(timer)
            }
          }, 1000)
        } else {
          ElMessage.error(response.message || '获取验证码失败')
          countDown.value = 0
        }
      } catch (error: any) {
        ElMessage.error(error.message || '获取验证码失败')
        countDown.value = 0
      }
    }

    // 注册处理
    const handleRegister = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          try {
            // 构造注册请求数据
            const registerData: RegisterRequest = {
              identifyType: registerForm.identifyType,
              identifier: registerForm.identifier,
              verifyCode: registerForm.verifyCode
            }

            // 调用注册API
            const response = await userApi.register(registerData)

            // 检查注册结果
            if (response && (response.code === 200 || response.success === true)) {
              ElMessage.success('注册成功')

              // 跳转到登录页
              await router.push('/login')
            } else {
              ElMessage.error(response.message || '注册失败')
            }
          } catch (error: any) {
            ElMessage.error(error.message || '注册失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      registerForm,
      formRef,
      loading,
      rules,
      handleRegister,
      getVerifyCode,
      identifierPlaceholder,
      isCountingDown,
      countDownText,
      router
    }
  }
})
</script>

<style scoped>.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.register-form {
  width: 450px;
  padding: 30px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.register-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
</style>
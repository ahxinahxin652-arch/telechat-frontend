import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import axios from "axios"; // 除非 main.ts 里要用，否则不需要在这里导入
// import request from "./api/request"; // 同上，通常不需要在 main.ts 里 app.use 它
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import themeManager from './utils/themeManager'
import { createPinia } from 'pinia'

// 1. 初始化主题
themeManager.init();

const app = createApp(App)

// 2. 注册插件 (Vue 官方插件或第三方 UI 库插件)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// --- 【重点修改：删掉下面这两行】 ---
// app.use(request)
// app.use(axios)
// --------------------------------

// 3. 添加全局样式（建议实际项目中移至 assets/css/main.css）
const style = document.createElement('style')
style.innerHTML = `
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
  *, *::before, *::after {
    box-sizing: inherit;
  }`
document.head.appendChild(style)

// 4. 挂载应用
app.mount('#app')
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from "axios";
import request from "./api/request";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import themeManager from './utils/themeManager'
import { createPinia } from 'pinia' // 导入 Pinia

// 初始化主题
themeManager.init();

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.use(request)
app.use(axios)
app.use(createPinia()) // 使用 Pinia

// 添加全局样式（去掉浏览器body自带的margin等css）
const style = document.createElement('style')
style.innerHTML = `  html, body {
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

// 挂载应用（只调用一次）
app.mount('#app')


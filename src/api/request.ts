import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 创建axios实例
const request: AxiosInstance = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8888',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器(每次请求都添加token)
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 确保 headers 存在
        if (!config.headers) {
            config.headers = {} as any;
        }
        // 在发送请求之前添加 token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        // 对请求错误做些什么
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器(每次响应都处理)
request.interceptors.response.use(
    (response: AxiosResponse) => {
        // 对响应数据做点什么
        return response.data
    },
    (error) => {
        // 对响应错误做点什么
        console.error('Response error:', error);
        if (error.response?.status === 401) {
            // 处理未授权错误
            console.log('Unauthorized, removing token');
            localStorage.removeItem('token')
            // 跳转到登录页
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default request
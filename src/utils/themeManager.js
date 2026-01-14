class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.themeLink = null;
    }

    // 初始化主题
    init() {
        this.loadTheme(this.currentTheme);
    }

    // 加载指定主题
    loadTheme(theme) {
        // 如果已有主题链接，先移除
        if (this.themeLink) {
            document.head.removeChild(this.themeLink);
        }

        // 创建新的主题链接
        this.themeLink = document.createElement('link');
        this.themeLink.rel = 'stylesheet';
        this.themeLink.type = 'text/css';
        // 使用public目录下的路径
        this.themeLink.href = `/themes/${theme}.css`;

        // 添加到head中
        document.head.appendChild(this.themeLink);
        this.currentTheme = theme;

        // 保存到本地存储
        localStorage.setItem('theme', theme);
    }

    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.loadTheme(newTheme);
        return newTheme;
    }

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// 创建单例实例
const themeManager = new ThemeManager();
export default themeManager;
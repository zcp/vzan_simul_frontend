// 生产环境配置
const CONFIG = {
    // ===== 直播SaaS后端API地址 =====
    VITE_BASE_API_URL: 'https://124.220.235.226/api/core/',
    
    // ===== 用户认证服务配置 =====
    VITE_AUTH_API_URL: 'https://124.220.235.226/api/users/',
    VITE_LOGIN_URL: 'https://124.220.235.226/pages/auth/login',
    
    // ===== 用户服务前端地址配置 =====
    VITE_FRONTEND_USER_URL: 'http://localhost:5173',
    
    // ===== 应用路径配置 =====
    VITE_APP_BASE_PATH: '/live-center',
    VITE_AUTH_REDIRECT_PATH: '/pages/room/new/RoomList'
    // ===== 其他配置 =====
    VITE_APP_TITLE: '直播SaaS平台',
    VITE_API_TIMEOUT: '30000',
    VITE_APP_ENV: 'production',
    VITE_DEBUG: false,
  };
  
  // 导出配置到全局
  if (typeof window !== 'undefined') {
    window.__ENV = CONFIG;
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
  }
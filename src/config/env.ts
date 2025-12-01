// 环境变量配置文件 - 支持多环境部署
export const ENV_CONFIG = {
  // ===== 直播SaaS后端API地址 =====
  VITE_BASE_API_URL: import.meta.env.VITE_BASE_API_URL || 'http://124.220.235.226:8000/api/v1',
  
  // ===== 用户认证服务配置 =====
  VITE_AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8002/',
  VITE_LOGIN_URL: import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173/pages/auth/login',
  
  VITE_APP_BASE_PATH: import.meta.env.VITE_APP_BASE_PATH || '/live-center',
  
  // ===== 用户服务前端地址配置 =====
  VITE_FRONTEND_USER_URL: import.meta.env.VITE_FRONTEND_USER_URL || 'http://localhost:5173',
  
  // ===== 跨服务回调配置 =====
  VITE_CALLBACK_PATH: import.meta.env.VITE_CALLBACK_PATH || '/pages/auth/callback',
  
  VITE_AUTH_REDIRECT_PATH: '/pages/room/new/RoomList',
   
  // ===== 其他配置 =====
  VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE || '直播SaaS平台',
  VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT || '30000',
  
  // ===== 环境标识 =====
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  VITE_DEBUG: import.meta.env.VITE_DEBUG === 'true',
};

// 开发/生产环境自动检测
const isDev = typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               ENV_CONFIG.VITE_APP_ENV === 'development');

// 导出到全局供 constants/api.ts 读取
declare global {
  interface Window {
    __ENV?: typeof ENV_CONFIG;
  }
}

if (typeof window !== 'undefined') {
  window.__ENV = ENV_CONFIG;
}
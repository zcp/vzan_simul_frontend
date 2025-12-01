import { defineStore } from 'pinia';
import { LOGIN_URL, FRONTEND_USER_URL, APP_BASE_PATH } from '@/constants/api';

// --- Start: JWT Generation for Development ---

// Helper to encode ArrayBuffer to a URL-safe Base64 string
function base64urlEncode(input: ArrayBuffer): string {
  // @ts-ignore
  let u8 = new Uint8Array(input);
  let b64 = btoa(String.fromCharCode.apply(null, u8));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Simple UUID v4 generator for jti claim
function uuidv4(): string {
  // @ts-ignore
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// Generates a real JWT token using Web Crypto API (for H5 environment)
async function generateRealToken(): Promise<string> {
  const secretKey = 'my-key';
  const userPublicId = '5080c21a-104b-4fe0-8f50-a3168e55c132';
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userPublicId,
    role: 'ADMIN', // 添加管理员角色
    type: 'access',
    iat: now,
    exp: now + 3600, // Expires in 1 hour
    jti: uuidv4()
  };

  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    algorithm,
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(algorithm.name, key, new TextEncoder().encode(dataToSign));
  
  const encodedSignature = base64urlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

// --- End: JWT Generation for Development ---

// 认证工具函数
export const getToken = (): string | null => {
  return uni.getStorageSync('jwt_token') || null;
};

const setToken = (token: string): void => {
  uni.setStorageSync('jwt_token', token);
};

const clearToken = (): void => {
  uni.removeStorageSync('jwt_token');
  uni.removeStorageSync('auth_redirect_path');
};

const checkTokenExpiry = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

const parseUserFromToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      user_id: payload.user_id || payload.sub,
      username: payload.username,
      email: payload.email
    };
  } catch (error) {
    console.error('解析Token失败:', error);
    return null;
  }
};

const setRedirectPath = (path: string): void => {
  uni.setStorageSync('auth_redirect_path', path);
};

const getRedirectPath = (): string | null => {
  return uni.getStorageSync('auth_redirect_path') || null;
};

const clearRedirectPath = (): void => {
  uni.removeStorageSync('auth_redirect_path');
};

// 类型定义
export interface User {
  user_id: string;
  username?: string;
  email?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  tokenExpiry: number | null;
  redirectPath: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    tokenExpiry: null,
    redirectPath: null
  }),

  getters: {
    isTokenValid: (state) => {
      if (!state.token) return false;
      return checkTokenExpiry(state.token);
    }
  },

  actions: {
    // 初始化认证状态
    async initializeAuth() {
      console.log('🔄 初始化认证状态...');
      
      // 首先尝试从uni-app存储读取
      const savedToken = getToken();
      console.log('📱 从uni-app存储读取token:', savedToken ? '存在' : '不存在');
      
      // 如果uni-app存储中没有，尝试从localStorage读取（H5平台）
      let token = savedToken;
      if (!token && typeof window !== 'undefined') {
        const localStorageToken = localStorage.getItem('jwt_token');
        console.log('🌐 从localStorage读取token:', localStorageToken ? '存在' : '不存在');
        if (localStorageToken) {
          // 将localStorage中的token同步到uni-app存储
          setToken(localStorageToken);
          token = localStorageToken;
        }
      }
      
      // 检查URL参数中是否有token（用于认证回调）
      if (!token && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        console.log('🔗 从URL参数读取token:', urlToken ? '存在' : '不存在');
        if (urlToken) {
          token = urlToken;
          // 将URL中的token存储到localStorage
          localStorage.setItem('jwt_token', urlToken);
          setToken(urlToken);
        }
      }
      
      if (token) {
        console.log('🔍 验证token有效性...');
        if (checkTokenExpiry(token)) {
          console.log('✅ Token有效，设置认证状态');
          this.setToken(token);
          this.parseUserFromToken(token);
        } else {
          console.log('❌ Token已过期，清除认证状态');
          this.clearAuth();
        }
      } else {
        console.log('❌ 未找到有效token');
      }
    },

    // 设置Token
    setToken(token: string) {
      console.log('🔑 设置Token:', token ? '已设置' : '未设置');
      this.token = token;
      setToken(token);
      this.isAuthenticated = true;
      console.log('✅ 认证状态已更新:', {
        isAuthenticated: this.isAuthenticated,
        hasToken: !!this.token
      });
    },

    // 解析用户信息
    parseUserFromToken(token: string) {
      const user = parseUserFromToken(token);
      if (user) {
        this.user = user;
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          this.tokenExpiry = payload.exp * 1000;
        } catch (error) {
          console.error('解析Token过期时间失败:', error);
        }
      }
    },

    // 清除认证状态
    clearAuth() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      this.tokenExpiry = null;
      clearToken();
    },

    // 设置重定向路径
    setRedirectPath(path: string) {
      this.redirectPath = path;
      setRedirectPath(path);
    },

    // 获取重定向路径
    getRedirectPath() {
      return this.redirectPath || getRedirectPath();
    },

    // 清除重定向路径
    clearRedirectPath() {
      this.redirectPath = null;
      clearRedirectPath();
    },

    // 处理认证后的重定向
    handleAuthRedirect() {
      const redirectPath = this.getRedirectPath();
      
      if (redirectPath && redirectPath !== '/pages/auth/login') {
        console.log('重定向到:', redirectPath);
        this.clearRedirectPath();
        uni.navigateTo({ url: redirectPath });
      } else {
        console.log('重定向到默认页面');
        uni.navigateTo({ url: '/pages/room/new/RoomList' });
      }
    },

    // [NEW] Action to perform mock login with a real JWT
    async mockLoginWithRealToken() {
      console.log('🚀 [DEV] Attempting to generate real JWT and log in...');
      try {
        const token = await generateRealToken();
        console.log('✅ [DEV] JWT generated successfully.');
        this.setToken(token);
        this.parseUserFromToken(token);
        this.handleAuthRedirect();
      } catch (error) {
        console.error('❌ [DEV] Failed to generate or process real JWT:', error);
        uni.showToast({
          title: '开发登录失败，请查看控制台',
          icon: 'none'
        });
      }
    },

    // 强制重新认证
    forceReauth(targetPath: string) {
      this.clearAuth();
      this.setRedirectPath(targetPath);
      
      console.log('🚫 [DEV] Intercepted forceReauth. Initiating mock login with real JWT.');
      this.mockLoginWithRealToken();
    },

    // 登出并跳转到登录页面
    logout() {
      this.clearAuth();
      this.clearRedirectPath();
      
      // #ifdef H5
      // H5平台：使用window.location.href跳转
      window.location.href = LOGIN_URL;
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序：跳转到登录页面
      uni.navigateTo({
        url: '/pages/auth/login',
        fail: () => {
          uni.showToast({
            title: '跳转失败，请手动打开登录页面',
            icon: 'none'
          });
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      // App平台：跳转到登录页面
      uni.navigateTo({
        url: '/pages/auth/login',
        fail: () => {
          uni.showToast({
            title: '跳转失败，请手动打开登录页面',
            icon: 'none'
          });
        }
      });
      // #endif
    },

    // 跳转到用户服务
    goToUserService(page: string) {
      const userServiceUrl = `${FRONTEND_USER_URL}${page}`;
      
      // #ifdef H5
      // H5平台：使用window.location.href进行跨服务跳转
      window.location.href = userServiceUrl;
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序：跳转到其他小程序
      uni.navigateToMiniProgram({
        appId: '用户服务小程序的appId', // 需要配置用户服务小程序的appId
        path: page,
        success: () => {
          console.log('跳转到用户服务小程序成功');
        },
        fail: (err) => {
          console.error('跳转到用户服务小程序失败:', err);
          // 降级处理：显示提示信息
          uni.showToast({
            title: '跳转失败，请手动打开用户服务',
            icon: 'none'
          });
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      // App平台：使用uni.navigateTo进行页面跳转
      uni.navigateTo({
        url: userServiceUrl,
        fail: (err) => {
          console.error('App跳转失败:', err);
          // 降级处理：尝试使用redirectTo
          uni.redirectTo({
            url: userServiceUrl,
            fail: () => {
              uni.showToast({
                title: '跳转失败，请手动打开用户服务',
                icon: 'none'
              });
            }
          });
        }
      });
      // #endif
    }
  }
});

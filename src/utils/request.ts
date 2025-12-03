/**
 * 统一网络请求工具
 * 封装uni.request，提供请求拦截器和响应拦截器
 */

import { ENV_CONFIG } from '../config/env';
import { getToken } from '@/store/auth';
import { useAuthStore } from '@/store/auth';

// API基础URL，从环境配置中获取
const BASE_URL = ENV_CONFIG.VITE_BASE_API_URL;

// 获取认证Token的函数，从认证模块中获取
const getAuthToken = (): string => {
  const token = getToken();
  console.log('🔍 getAuthToken调用:', {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
  });
  return token || '';
};

/**
 * 从 document.cookie 中读取csrftoken（仅 H5 环境）
 */
const getCsrfToken = (): string | null => {
  // #ifdef H5
  if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
    const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
  }
  // #endif
  return null;
};

/**
 * 请求配置接口
 */
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  // 是否显示加载提示
  showLoading?: boolean;
  // 是否需要认证
  auth?: boolean;
}

/**
 * 统一请求函数
 * @param options 请求配置
 * @param retry 重试次数，默认3次
 * @param timeout 超时时间，默认5000ms
 * @returns Promise 返回请求结果
 */
export const request = <T = any>(options: RequestOptions, retry = 3, timeout = 5000): Promise<T> => {
  // 显示加载提示
  if (options.showLoading !== false) {
    uni.showLoading({
      title: '加载中...',
      mask: true
    });
  }

  // 调试信息：记录请求开始
  console.log('🌐 请求开始:', {
    url: options.url,
    method: options.method,
    retry: retry,
    timeout: timeout,
    timestamp: new Date().toISOString()
  });

  // 测试阶段：网络诊断
  const fullUrl = /^(http|https):\/\//.test(options.url) 
    ? options.url 
    : BASE_URL.replace(/\/+$/, '') + '/' + options.url.replace(/^\/+/, '');
    
  console.log('🔍 网络诊断信息:', {
    url: options.url,
    baseUrl: BASE_URL,
    fullUrl: fullUrl,
    env: process.env.NODE_ENV,
    userAgent: navigator?.userAgent || 'unknown'
  });

  // 测试阶段：检查网络连接
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    console.warn('⚠️ 检测到离线状态，请检查网络连接');
  }

  // 构建完整URL（修复双斜杠问题）
  const url = /^(http|https):\/\//.test(options.url) 
    ? options.url 
    : BASE_URL.replace(/\/+$/, '') + '/' + options.url.replace(/^\/+/, '');

  // 测试阶段：完全绕过HTTPS验证（生产环境请恢复此验证）
  if (
    process.env.NODE_ENV === 'production' &&
    !/^https:\/\//.test(url)
  ) {
    console.warn('⚠️ 测试阶段：生产环境使用HTTP协议，请确保安全！');
    // 测试阶段暂时注释掉HTTPS验证
    // uni.hideLoading();
    // throw new Error('安全限制：仅允许通过 HTTPS 协议请求 API！');
  }
  
  // 测试阶段：允许所有HTTP请求
  if (/^http:\/\//.test(url)) {
    console.warn('🔧 测试阶段：使用 HTTP 协议，生产环境请使用 HTTPS');
  }

  // 构建请求头
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.header,
  };

  // 自动注入JWT Token（增量开发：JWT认证拦截器）
  const token = getAuthToken();
  console.log('🔑 请求认证Token:', {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
  });
  
  // 验证JWT格式
  const isValidJWT = token && token.split('.').length === 3;
  if (token && token.trim() && isValidJWT) {
    // 尝试多种认证头格式
    header['Authorization'] = `Bearer ${token}`;
    // 如果Bearer格式不工作，可以尝试：
    // header['Authorization'] = `JWT ${token}`;
    // header['Authorization'] = token;
    // header['X-Auth-Token'] = token;
  } else {
    console.log('❌ 未找到有效认证Token或格式错误，请求可能失败');
  }

  // 添加CSRF Token
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    header['X-CSRFToken'] = csrfToken;
  }

  // 调试：打印完整请求头
  console.log('📋 完整请求头:', header);

  return new Promise<T>((resolve, reject) => {
    let isTimeout = false;
    const timer = setTimeout(() => {
      isTimeout = true;
      uni.hideLoading();
      reject(new Error('请求超时'));
    }, timeout);

    uni.request({
      url,
      method: options.method as any || 'GET',
      data: options.data,
      header,
      success: (res: any) => {
        clearTimeout(timer);
        if (isTimeout) return;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
                 } else if (res.statusCode === 401) {
           // 增量开发：401认证失败处理
           console.error('🔐 401认证失败:', {
             statusCode: res.statusCode,
             data: res.data,
             headers: res.header,
             url: url
           });
           try {
             const authStore = useAuthStore();
             const currentPath = getCurrentPages()[getCurrentPages().length - 1].route;
             authStore.forceReauth(`/pages/${currentPath}`);
           } catch (error) {
             console.error('认证失败处理错误:', error);
             uni.showToast({
               title: '登录已过期，请重新登录',
               icon: 'none',
               duration: 2000
             });
           }
           reject(new Error('Unauthorized'));
        } else if (res.statusCode === 403) {
          uni.showToast({
            title: '您没有权限执行此操作',
            icon: 'none',
            duration: 2000
          });
          reject(new Error('Forbidden'));
        } else if (res.statusCode === 404) {
          uni.showToast({
            title: '请求的资源不存在',
            icon: 'none',
            duration: 2000
          });
          reject(new Error('Not Found'));
        } else {
          console.error(`HTTP Error: ${res.statusCode}`, {
            url,
            method: options.method,
            requestData: options.data,
            responseBody: res.data,
          });
          const errorMessage = typeof res.data === 'string' ? res.data : `HTTP Error: ${res.statusCode}`;
          uni.showToast({
            title: `请求错误: ${res.statusCode}`,
            icon: 'none',
            duration: 2000
          });
          reject(new Error(errorMessage));
        }
      },
                   fail: (err) => {
        clearTimeout(timer);
        if (isTimeout) return;
        
        // 详细错误日志
        console.error('🔍 请求失败详情:', {
          error: err,
          errorMessage: err.errMsg,
          url: url,
          method: options.method,
          headers: header,
          retryCount: retry,
          timeout: timeout,
          timestamp: new Date().toISOString()
        });
         
         // 网络错误处理
         let errorMessage = '网络请求失败';
         if (err.errMsg) {
           if (err.errMsg.includes('timeout')) {
             errorMessage = '请求超时，请检查网络';
           } else if (err.errMsg.includes('fail')) {
             errorMessage = '网络连接失败，请检查网络设置';
           } else if (err.errMsg.includes('proxy')) {
             errorMessage = '代理连接失败，请检查网络配置';
           } else if (err.errMsg.includes('401')) {
             errorMessage = '认证失败，请重新登录';
           } else if (err.errMsg.includes('403')) {
             errorMessage = '权限不足';
           } else if (err.errMsg.includes('404')) {
             errorMessage = '请求的资源不存在';
           } else if (err.errMsg.includes('500')) {
             errorMessage = '服务器内部错误';
           }
         }
         
                 if (retry > 0) {
          // 自动重试
          console.log(`🔄 请求失败，${retry}秒后重试...`, {
            originalError: err.errMsg,
            retryCount: retry,
            url: url,
            method: options.method,
            timestamp: new Date().toISOString()
          });
          setTimeout(() => {
            request(options, retry - 1, timeout).then(resolve).catch(reject);
          }, 1000); // 增加重试延迟到1秒
        } else {
           console.error('❌ 最终请求失败:', {
             error: err,
             errorMessage: errorMessage,
             url: url
           });
           uni.showToast({
             title: errorMessage,
             icon: 'none',
             duration: 2000
           });
           reject(err);
         }
       },
      complete: () => {
        clearTimeout(timer);
        if (options.showLoading !== false) {
          uni.hideLoading();
        }
      }
    });
  });
};

/**
 * 统一GET请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
export const get = <T = any>(url: string, data?: any, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) => {
  return request<T>({
    url,
    method: 'GET',
    data,
    ...options
  });
};

/**
 * 统一POST请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 其他选项
 * @returns Promise
 */
export const post = <T = any>(url: string, data?: any, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  }, 0, 5000); // 禁用重试机制，避免重复创建
};

/**
 * 统一PUT请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 其他选项
 * @returns Promise
 */
export const put = <T = any>(url: string, data?: any, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

/**
 * 统一DELETE请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 其他选项
 * @returns Promise
 */
export const del = <T = any>(url: string, data?: any, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  }, 0, 5000); // 禁用重试机制，避免重复删除
};

/**
 * 统一PATCH请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 其他选项
 * @returns Promise
 */
export const patch = <T = any>(url: string, data?: any, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) => {
  return request<T>({
    url,
    method: 'PATCH',
    data,
    ...options
  }, 0, 5000); // 禁用重试机制，避免重复操作
}; 
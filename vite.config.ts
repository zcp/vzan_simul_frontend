/// <reference types="vitest" />
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";

// 根据环境设置不同的 base 路径
const isProduction = process.env.NODE_ENV === 'production';
const base = isProduction ? '/live-center/' : '/';

// https://vitejs.dev/config/
export default defineConfig({
  base: base,  // 添加这行
  server: {
	port: 5174,
    proxy: {
      // 图片代理：必须放在 /api 之前，否则会被 /api 抢先匹配
      '/api/image': {
        target: 'https://a2.vzan.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/image/, ''),
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 [Proxy] Forwarding:', req.url, '=> https://a2.vzan.com' + req.url?.replace('/api/image', ''));
            // 核心：伪造 Referer，骗过服务器
            proxyReq.setHeader('Referer', 'https://a2.vzan.com/');
            // 伪造 UA，模拟浏览器
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          });
        },
        bypass: (req, res, options) => {
          if (req.url?.startsWith('/api/image')) {
             console.log('🎯 [Proxy Match] /api/image matched:', req.url);
             return null;
          }
        }
      },
      // m3u8 代理：用于解决 vzan 流的 403 防盗链问题
      // 前端统一使用 /api/m3u8?url=encodeURIComponent(realUrl)
      // 这里直接将请求转发到原始 url 指定的主机，由代理层伪造 Referer/UA
      '/api/m3u8': {
        target: 'https://qvod2.vzan.com', // 只是占位，真正的目标由 url 参数中的域名决定
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (targetUrl) {
              // 让代理请求真正的 m3u8 地址
              console.log('🎬 [HLS Proxy] Forwarding to:', targetUrl);
              proxyReq.path = targetUrl;
            }
            // 伪造 Referer/UA，模拟在 vzan 页面内播放
            proxyReq.setHeader('Referer', 'https://www.vzan.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          });
        }
      },
      '/api': {
        target: 'http://124.220.235.226:8000',
        changeOrigin: true,
      },
      // 添加HLS流代理
      '/hls-proxy': {
        target: 'https://124.220.235.226',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hls-proxy/, '/hls'),
        secure: false, // 忽略SSL证书验证
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加CORS头
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 添加CORS响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Range, Content-Type';
            proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range';
          });
        }
      }
    },
    // 确保静态文件能够正确访问
    fs: {
      allow: ['..']
    }
  },
    // 添加环境变量定义
    define: {
      'process.env': {},
      'import.meta.env.VITE_BASE_API_URL': JSON.stringify(
        isProduction ? 'https://124.220.235.226/api/core/' : 'http://124.220.235.226:8000/api/v1'
      ),
      'import.meta.env.VITE_AUTH_API_URL': JSON.stringify(
        isProduction ? 'https://124.220.235.226/api/users/' : 'http://localhost:8002/'
      ),
      'import.meta.env.VITE_LOGIN_URL': JSON.stringify(
        isProduction ? 'https://124.220.235.226/pages/auth/login' : 'https://124.220.235.226/pages/auth/login'
      ),
      'import.meta.env.VITE_FRONTEND_USER_URL': JSON.stringify(
        isProduction ? 'https://124.220.235.226/' : 'https://124.220.235.226/'
      ),
      'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(
        isProduction ? '/live-center' : '/'
      ),
    },
  plugins: [
    uni({
      vueOptions: {
        // Exclude uni-ui from the uni plugin's processing to avoid compilation errors in tests.
        exclude: [/@dcloudio\/uni-ui/],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    deps: {
      // Force Vitest to transform uni-ui, as it's not published as standard ESM.
      inline: [/@dcloudio\/uni-ui/],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Add an alias to hijack the problematic component and replace it with an empty one.
      "@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue": path.resolve(__dirname, "tests/EmptyComponent.vue"),
      // 注意：不要把 @vue/* 映射到 vue/*，否则会触发
      // "Missing \"./runtime-dom\" specifier in \"vue\" package" 错误。
      // 让 bundler 直接解析官方包的子入口即可。
    },
  },
  // 确保环境变量能被正确加载
  // 排除 hls.js 在非 H5 环境中的打包
  build: {
    rollupOptions: {
      external: (id) => {
        // 在非 H5 环境中排除 hls.js
        if (process.env.UNI_PLATFORM !== 'h5' && id.includes('hls.js')) {
          return true;
        }
        return false;
      },
       // 添加复制插件
      plugins: [
        {
          name: 'copy-env-config',
          generateBundle() {
            // 在构建时复制配置文件到 dist 目录
            this.emitFile({
              type: 'asset',
              fileName: 'config/env.prod.js',
              source: require('fs').readFileSync('src/config/env.prod.js', 'utf8')
            });
          }
        },
        {
          name: 'copy-public-files',
          generateBundle() {
            // 复制 public 目录下的 HTML 文件
            this.emitFile({
              type: 'asset',
              fileName: 'hls-player.html',
              source: require('fs').readFileSync('public/hls-player.html', 'utf8')
            });
            this.emitFile({
              type: 'asset',
              fileName: 'simple-callback.html',
              source: require('fs').readFileSync('public/simple-callback.html', 'utf8')
            });
          }
        }
      ]
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 只对依赖静默警告（Dart Sass 选项）
        quietDeps: true,
        // 精准静默本次出现的三类弃用
        silenceDeprecations: ['legacy-js-api', 'global-builtin', 'color-functions'],
      },
    },
  },
});

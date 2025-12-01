import { createSSRApp } from "vue";
import * as Pinia from "pinia";
import App from "./App.vue";
import './common/uni.scss'
import { useAuthStore } from './store/auth';

// 1. 导入 Element Plus 和样式
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 2. 导入所有 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = Pinia.createPinia();
  app.use(pinia);

  // 3. 全局注册 Element Plus
  app.use(ElementPlus);

  // 4. 全局注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
  
  // 增量开发：初始化认证状态
  const authStore = useAuthStore();
  authStore.initializeAuth();
  
  return {
    app,
    Pinia,
  };
} 

import { defineStore } from 'pinia';
import type { Session, SessionCreatePayload } from '../types/session';
import { getSessionList, getSessionDetail, createSession, updateSession, deleteSession } from '../api/session';

export const useSessionStore = defineStore('session', {
  state: () => ({
    sessions: [] as Session[],
    currentSession: null as Session | null,
    loading: false,
    error: null as Error | null,
    pagination: {
      page: 1,
      size: 10,
      hasMore: true,
      total: 0,
    },
  }),
  actions: {
    async fetchSessionsByRoomId(roomId: string, options: { refresh?: boolean } = {}) {
      console.log(`🔍 SessionStore: 开始获取房间 ${roomId} 的session数据`);
      
      if (this.loading && !options.refresh) return;
      this.loading = true;
      this.error = null;
      if (options.refresh) {
        this.pagination.page = 1;
        this.sessions = [];
      }
      try {
        console.log(`📡 SessionStore: 调用API获取房间 ${roomId} 的session数据`);
        const response: any = await getSessionList(roomId, {
          page: this.pagination.page,
          size: this.pagination.size,
        });
        console.log(`📊 SessionStore: API响应数据:`, response);
        
        // 兼容统一响应结构和直接业务数据两种情况
        let items, total, page, size;
        if ('code' in response && 'data' in response) {
          if (response.code === 200 && response.data) {
            ({ items, total, page, size } = response.data);
            console.log(`✅ SessionStore: 解析后的数据 - items:`, items, 'total:', total);
          } else {
            console.error(`❌ SessionStore: API返回错误 - code:`, response.code, 'message:', response.message);
            throw new Error(response.message || 'Failed to fetch sessions');
          }
        } else {
          ({ items, total, page, size } = response);
          console.log(`✅ SessionStore: 直接解析数据 - items:`, items, 'total:', total);
        }
        const newSessions = items || [];
        console.log(`📋 SessionStore: 处理后的session数据:`, newSessions);
        
        if (options.refresh) {
          this.sessions = newSessions;
        } else {
          this.sessions.push(...newSessions);
        }
        this.pagination.total = total || 0;
        this.pagination.hasMore = newSessions.length === this.pagination.size;
        if (this.pagination.hasMore) {
          this.pagination.page++;
        }
        
        console.log(`✅ SessionStore: 最终sessions数组:`, this.sessions);
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to fetch sessions for roomId=${roomId}:`, err);
        throw new Error(err.message || 'Failed to fetch sessions');
      } finally {
        this.loading = false;
      }
    },
    async fetchSessionById(id: string) {
      this.loading = true;
      this.error = null;
      this.currentSession = null;
      try {
        const response: any = await getSessionDetail(id);
        if ('code' in response && 'data' in response) {
          if (response.code === 200 && response.data) {
            console.log('getSessionDetail返回：', response);
            this.currentSession = response.data;
            console.log('赋值后currentSession：', this.currentSession);
          } else {
            throw new Error(response.message || 'Failed to fetch session details');
          }
        } else {
          this.currentSession = response;
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to fetch session detail, id=${id}:`, err);
        throw new Error(err.message || 'Failed to fetch session details');
      } finally {
        this.loading = false;
      }
    },
    async createSession(roomId: string, payload: SessionCreatePayload): Promise<{ success: boolean; message?: string }> {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await createSession(roomId, payload);
        if ('code' in response && 'data' in response) {
          if (response.code === 200 && response.data) {
            await this.fetchSessionsByRoomId(roomId, { refresh: true });
            return { success: true, message: '场次创建成功' };
          } else {
            return { success: false, message: response.message || '创建失败' };
          }
        } else {
          await this.fetchSessionsByRoomId(roomId, { refresh: true });
          return { success: true, message: '场次创建成功' };
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to create session for roomId=${roomId}:`, err);
        return { success: false, message: err.message || '创建失败' };
      } finally {
        this.loading = false;
      }
    },
    async updateSession(id: string, payload: Partial<Session>) {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await updateSession(id, payload);
        if ('code' in response && 'data' in response) {
          if (response.code === 200 && response.data) {
            uni.showToast({ title: '更新成功', icon: 'success' });
            return true;
          } else {
            throw new Error(response.message || '更新失败');
          }
        } else {
          uni.showToast({ title: '更新成功', icon: 'success' });
          return true;
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to update session id=${id}:`, err);
        throw new Error(err.message || '更新失败');
      } finally {
        this.loading = false;
      }
    },
    async deleteSession(id: string, roomId: string) {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await deleteSession(id);
        if ('code' in response && 'data' in response) {
          if (response.code === 200 && response.data) {
            await this.fetchSessionsByRoomId(roomId, { refresh: true });
            uni.showToast({ title: '删除成功', icon: 'success' });
            return true;
          } else {
            throw new Error(response.message || '删除失败');
          }
        } else {
          await this.fetchSessionsByRoomId(roomId, { refresh: true });
          uni.showToast({ title: '删除成功', icon: 'success' });
          return true;
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to delete session id=${id}:`, err);
        throw new Error(err.message || '删除失败');
      } finally {
        this.loading = false;
      }
    },

    // 设置当前session
    setCurrentSession(session: Session | null) {
      this.currentSession = session;
    },
  },
});
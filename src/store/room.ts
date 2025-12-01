import { defineStore } from 'pinia';
import type { Room, RoomCreatePayload } from '../types/room';
import { get, post, del, put, patch } from '../utils/request';
import { getSubVenues, createSubVenue, updateSubVenue, deleteSubVenue } from '../api/room';
import { BASE_API_URL } from '@/constants/api';

export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [] as Room[],
    currentRoom: null as Room | null,
    loading: false,
    error: null as Error | null,
    pagination: {
      page: 1,
      size: 10,
      hasMore: true,
      total: 0, // 新增总页数
    },
    // 分会场相关状态
    subVenues: [] as Room[],
    subVenuesLoading: false,
    subVenuesError: null as Error | null,
  }),
  actions: {
    async fetchRooms(options: { refresh?: boolean, page?: number } = {}) {
      if (this.loading && !options.refresh) return;
      this.loading = true;
      this.error = null;

      if (options.refresh) {
        // 支持外部指定页码跳转
        if (typeof options.page === 'number' && options.page > 0) {
          this.pagination.page = options.page;
        } else {
          this.pagination.page = 1;
        }
        this.rooms = [];//清空当前的房间列表
      }

      try {
        // 后端返回的数据结构是 { code, message, data: { items, total, ... } }
        const response: any = await get('/rooms', {
          page: this.pagination.page,
          size: this.pagination.size,
        });
        // --- DEBUG: 打印后端返回的原始数据 ---
        console.log('DEBUG: API response in fetchRooms:', JSON.stringify(response, null, 2));

        if (response && (response.code === 200 || response.code === 0) && response.data) {
          const newRooms = (response.data.items || []).map((room: any) => {
            // 规范化 cover_url：相对路径 -> 绝对路径
            const cover = room?.cover_url;
            if (cover && typeof cover === 'string' && cover.startsWith('/')) {
              // BASE_API_URL 形如 http://localhost:8000/api/v1 -> 取其 origin
              try {
                const base = BASE_API_URL.replace(/\/+$/, '');
                const origin = base.replace(/\/api\/.*/, '');
                room.cover_url = origin + cover;
              } catch (e) {
                // 出错则保留原值
              }
            }
            return room;
          });
          if (options.refresh) {
            this.rooms = newRooms;
          } else {
            this.rooms.push(...newRooms);
          }
          // 记录总数
          if (typeof response.data.total === 'number') {
            this.pagination.total = response.data.total;
          }
          // 只有在非刷新模式下才递增页码（用于无限滚动）
          if (!options.refresh) {
            this.pagination.page++;
          }
          this.pagination.hasMore = newRooms.length === this.pagination.size;
        } else {
          throw new Error(response.message || 'Failed to fetch rooms');
        }

      } catch (err: any) {
        this.error = err;
        console.error("Failed to fetch rooms:", err);
      } finally {
        this.loading = false;
      }
    },
    async fetchRoomById(roomId: string) {
      this.loading = true;
      this.error = null;
      this.currentRoom = null;

      try {
        const response: any = await get(`/rooms/${roomId}`);
        if (response && (response.code === 200 || response.code === 0) && response.data) {
          const room = response.data as any;
          // 规范化详情的 cover_url
          if (room?.cover_url && typeof room.cover_url === 'string' && room.cover_url.startsWith('/')) {
            try {
              const base = BASE_API_URL.replace(/\/+$/, '');
              const origin = base.replace(/\/api\/.*/, '');
              room.cover_url = origin + room.cover_url;
            } catch {}
          }
          this.currentRoom = room;
        } else {
          throw new Error(response.message || 'Failed to fetch room details');
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to fetch room ${roomId}:`, err);
      } finally {
        this.loading = false;
      }
    },
    async addNewRoom(payload: RoomCreatePayload): Promise<{ success: boolean; room_id?: string; message?: string }> {
      // 防止重复调用
      if (this.loading) {
        console.log('⚠️ Store正在处理中，忽略重复请求');
        return { success: false, message: '正在处理中，请稍候' };
      }
      
      this.loading = true;
      this.error = null;
      
      console.log('🏪 Store开始创建房间:', {
        payload,
        timestamp: new Date().toISOString(),
        loading: this.loading
      });
      
      try {
        const response: any = await post('/rooms', payload);
        
        console.log('📡 API响应:', {
          code: response?.code,
          message: response?.message,
          data: response?.data,
          timestamp: new Date().toISOString()
        });

        if (response && response.code === 200 && response.data) {
          // 创建成功后，刷新整个列表以获取最准确的数据
          console.log('✅ 房间创建成功，开始刷新列表');
          await this.fetchRooms({ refresh: true });
          // 返回成功结果，包含room_id
          return { 
            success: true, 
            room_id: response.data.id || response.data.room_id,
            message: '房间创建成功'
          };
        } else {
          throw new Error(response.message || '创建失败');
        }
      } catch (err: any) {
        this.error = err;
        console.error("❌ Store创建房间失败:", err);
        return { 
          success: false, 
          message: err.message || '创建房间失败'
        };
      } finally {
        this.loading = false;
        console.log('🏪 Store创建房间完成，loading状态重置');
      }
    },
    async updateRoom(roomId: string, payload: Partial<RoomCreatePayload>): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await patch(`/rooms/${roomId}`, payload);
        if (response && (response.code === 200 || response.code === 0)) {
          return true;
        } else {
          throw new Error(response.message || '更新失败');
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to update room ${roomId}:`, err);
        throw err; // 抛出错误，让组件层能捕获到
      } finally {
        this.loading = false;
      }
    },

    async deleteRoom(roomId: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await del(`/rooms/${roomId}`);
        if (response && (response.code === 200 || response.code === 0)) {
          // 删除成功后，从本地列表中移除该房间
          this.rooms = this.rooms.filter(room => room.id !== roomId);
          return true;
        } else {
          throw new Error(response.message || '删除失败');
        }
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to delete room ${roomId}:`, err);
        throw err; // 抛出错误，让组件层能捕获到
      } finally {
        this.loading = false;
      }
    },

    async checkRoomHasSessions(roomId: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        const response: any = await get(`/rooms/${roomId}/sessions`, { page: 1, size: 1 });
        if (response && (response.code === 200 || response.code === 0) && response.data) {
          return response.data.total > 0;
        }
        // 如果接口本身失败，我们也保守地认为无法删除
        return true; 
      } catch (err: any) {
        this.error = err;
        console.error(`Failed to check sessions for room ${roomId}:`, err);
        // 发生错误时，为安全起见，也禁止删除
        return true;
      } finally {
        this.loading = false;
      }
    },

    // 分会场相关方法
    async fetchSubVenues(parentRoomId: string) {
      this.subVenuesLoading = true;
      this.subVenuesError = null;

      try {
        const response: any = await getSubVenues(parentRoomId);
        if (response && (response.code === 200 || response.code === 0) && response.data) {
          this.subVenues = response.data.items || [];
        } else {
          throw new Error(response.message || 'Failed to fetch sub venues');
        }
      } catch (err: any) {
        this.subVenuesError = err;
        console.error("Failed to fetch sub venues:", err);
      } finally {
        this.subVenuesLoading = false;
      }
    },

    async createSubVenue(payload: RoomCreatePayload & { parent_room_id: string }): Promise<boolean> {
      this.subVenuesLoading = true;
      this.subVenuesError = null;
      
      try {
        const response: any = await createSubVenue(payload);
        if (response && (response.code === 200 || response.code === 0)) {
          // 创建成功后刷新分会场列表
          await this.fetchSubVenues(payload.parent_room_id);
          return true;
        } else {
          throw new Error(response.message || '创建分会场失败');
        }
      } catch (err: any) {
        this.subVenuesError = err;
        console.error("Failed to create sub venue:", err);
        throw err;
      } finally {
        this.subVenuesLoading = false;
      }
    },

    async updateSubVenue(roomId: string, payload: Partial<RoomCreatePayload>): Promise<boolean> {
      this.subVenuesLoading = true;
      this.subVenuesError = null;
      
      try {
        const response: any = await updateSubVenue(roomId, payload);
        if (response && (response.code === 200 || response.code === 0)) {
          return true;
        } else {
          throw new Error(response.message || '更新分会场失败');
        }
      } catch (err: any) {
        this.subVenuesError = err;
        console.error(`Failed to update sub venue ${roomId}:`, err);
        throw err;
      } finally {
        this.subVenuesLoading = false;
      }
    },

    async deleteSubVenue(roomId: string, parentRoomId: string): Promise<boolean> {
      this.subVenuesLoading = true;
      this.subVenuesError = null;
      
      try {
        const response: any = await deleteSubVenue(roomId);
        if (response && (response.code === 200 || response.code === 0)) {
          // 删除成功后刷新分会场列表
          await this.fetchSubVenues(parentRoomId);
          return true;
        } else {
          throw new Error(response.message || '删除分会场失败');
        }
      } catch (err: any) {
        this.subVenuesError = err;
        console.error(`Failed to delete sub venue ${roomId}:`, err);
        throw err;
      } finally {
        this.subVenuesLoading = false;
      }
    },
  },
});
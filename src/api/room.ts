/**
 * 房间相关API
 * 封装所有与"房间"相关的API请求
 */
import { request, get, post, put, del, patch } from '../utils/request';
import type { Room, RoomCreatePayload, RoomTab } from '../types/room';

/**
 * 分页响应接口
 */
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * 获取房间列表
 * @param params 分页参数
 * @returns Promise<PaginatedResponse<Room>>
 */
export const getRoomList = (params: { page?: number; size?: number; parent_room_id?: string } = {}): Promise<PaginatedResponse<Room>> => {
  return get<PaginatedResponse<Room>>('/rooms', params);
};

/**
 * 获取单个房间详情
 * @param roomId 房间ID
 * @returns Promise<Room>
 */
export const getRoomDetail = (roomId: string): Promise<Room> => {
  return get<Room>(`/rooms/${roomId}`);
};

/**
 * 创建一个新的直播间
 * @param payload 创建房间所需的数据，如 { title: string, description: string }
 */
export const createRoom = (payload: RoomCreatePayload) => {
  return post<Room>('/rooms', payload, { auth: true }); // 向 /api/v1/rooms 发送POST请求
};

/**
 * 更新房间
 * @param roomId 房间ID
 * @param data 要更新的房间数据
 * @returns Promise<Room>
 */
export const updateRoom = (roomId: string, data: Partial<Room>): Promise<Room> => {
  // 使用 PATCH 更新部分字段
  return patch<Room>(`/rooms/${roomId}`, data, { auth: true });
};

/**
 * 删除房间
 * @param roomId 房间ID
 * @returns Promise<void>
 */
export const deleteRoom = (roomId: string): Promise<void> => {
  return del<void>(`/rooms/${roomId}`, undefined, { auth: true });
};

/**
 * 获取主会场下所有分会场
 * @param roomId 主会场ID
 * @param params 分页参数
 * @returns Promise<PaginatedResponse<Room>>
 */
export const getSubVenues = (roomId: string, params: { page?: number; size?: number } = {}): Promise<PaginatedResponse<Room>> => {
  return get<PaginatedResponse<Room>>(`/rooms/${roomId}/sub-venues`, params);
};

/**
 * 创建分会场
 * @param payload 创建分会场的数据，包含 parent_room_id
 * @returns Promise<Room>
 */
export const createSubVenue = (payload: RoomCreatePayload & { parent_room_id: string }): Promise<Room> => {
  return post<Room>('/rooms', payload, { auth: true });
};

/**
 * 更新分会场
 * @param roomId 分会场ID
 * @param data 要更新的数据
 * @returns Promise<Room>
 */
export const updateSubVenue = (roomId: string, data: Partial<Room>): Promise<Room> => {
  return put<Room>(`/rooms/${roomId}`, data, { auth: true });
};

/**
 * 删除分会场
 * @param roomId 分会场ID
 * @returns Promise<void>
 */
export const deleteSubVenue = (roomId: string): Promise<void> => {
  return del<void>(`/rooms/${roomId}`, undefined, { auth: true });
};

/**
 * 直播间留言接口
 */
export interface RoomMessage {
  id: string;
  room_id: string;
  session_id?: string | null;
  user_id: string;
  user_role: 'REGULAR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  content: string;
  created_at: string;
}

/**
 * 获取直播间留言列表
 * @param roomId 房间ID
 * @param params 查询参数
 */
export const getRoomMessages = (roomId: string, params: { page?: number; size?: number; since?: string } = {}): Promise<PaginatedResponse<RoomMessage>> => {
  return get<PaginatedResponse<RoomMessage>>(`/rooms/${roomId}/messages`, params);
};

/**
 * 发送直播间留言
 * @param roomId 房间ID
 * @param payload 留言内容
 */
export const sendRoomMessage = (roomId: string, payload: { content: string }): Promise<RoomMessage> => {
  return post<RoomMessage>(`/rooms/${roomId}/messages`, payload, { auth: true });
};

// --- Admin Tab APIs ---

/**
 * 获取 Tab 列表
 * GET /api/v1/admin/rooms/{room_id}/tabs
 */
export const getRoomTabList = (roomId: string): Promise<RoomTab[]> => {
  return get<RoomTab[]>(`/admin/rooms/${roomId}/tabs`, undefined, { auth: true });
};

/**
 * 创建 Tab
 * POST /api/v1/admin/rooms/{room_id}/tabs
 */
export const createRoomTab = (roomId: string, data: Partial<RoomTab>): Promise<RoomTab> => {
  return post<RoomTab>(`/admin/rooms/${roomId}/tabs`, data, { auth: true });
};

/**
 * 更新 Tab
 * PATCH /api/v1/admin/tabs/{tab_id}
 */
export const updateRoomTab = (tabId: string, data: Partial<RoomTab>): Promise<RoomTab> => {
  return patch<RoomTab>(`/admin/tabs/${tabId}`, data, { auth: true });
};

/**
 * 删除 Tab
 * DELETE /api/v1/admin/tabs/{tab_id}
 */
export const deleteRoomTab = (tabId: string): Promise<void> => {
  return del<void>(`/admin/tabs/${tabId}`, undefined, { auth: true });
};
 // api/session.ts
import { request } from '../utils/request';
import type { Session, SessionCreatePayload } from '../types/session';

// 统一响应结构
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 分页响应体
export interface PaginatedSessions {
  total: number;
  page: number;
  size: number;
  items: Session[];
}

// 获取房间下所有场次 (GET /rooms/{room_id}/sessions)
export const getSessionList = (roomId: string, params: { page?: number, size?: number }) => {
  return request<PaginatedSessions>({
    url: `/rooms/${roomId}/sessions`,
    method: 'GET',
    data: params,
  });
};

// 获取单个场次详情 (GET /sessions/{session_id})
export const getSessionDetail = (sessionId: string) => {
  return request<Session>({
    url: `/sessions/${sessionId}`,
    method: 'GET',
  });
};

// 创建场次 (POST /rooms/{room_id}/sessions)
export const createSession = (roomId: string, data: Partial<SessionCreatePayload>) => {
  return request<Session>({
    url: `/rooms/${roomId}/sessions`,
    method: 'POST',
    data,
  });
};

// 更新场次 (PATCH /sessions/{session_id})
export const updateSession = (sessionId: string, data: Partial<Session>) => {
  return request<Session>({
    url: `/sessions/${sessionId}`,
    method: 'PATCH',
    data,
  });
};

// 删除场次 (DELETE /sessions/{session_id})
export const deleteSession = (sessionId: string) => {
  return request<{ id: string; status: string }>({
    url: `/sessions/${sessionId}`,
    method: 'DELETE',
  });
};

import { SessionStatus } from "./session";

/**
 * 直播房间的基础信息
 */
export interface Room {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_private: boolean;
  record_by_default: boolean;
  stream_key: string;
  created_at: string;
  updated_at: string;
  live_status?: SessionStatus;
  current_session_id?: string;
  parent_room_id?: string; // 父房间ID，用于区分主会场和分会场
  tabs?: RoomTab[];
}

export type TabContentType = 'text' | 'image' | 'mixed';

export interface RoomTab {
  id: string;
  room_id: string;
  tab_key: string;
  title: string;
  content_type: TabContentType;
  text_content?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * 创建直播房间时需要发送的数据载荷
 */
export interface RoomCreatePayload {
  title: string;
  description?: string;
} 
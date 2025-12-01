 // 严格依据设计文档 6.2.3 session_statistics（场次统计表）
export interface Statistics {
    id: string; // UUID
    session_id: string; // UUID
    peak_viewer_count: number; // INT
    total_viewer_count: number; // BIGINT
    total_like_count: number; // BIGINT
    total_share_count: number; // BIGINT
    created_at: string; // TIMESTAMPTZ
    updated_at: string; // TIMESTAMPTZ
  }
  
  // 严格依据设计文档 6.2.2 live_sessions（直播场次表）
  export type SessionStatus = 'scheduled' | 'live' | 'finished' | 'processing' | 'ready' | 'error' | 'archived';
  
  export interface Session {
    id: string; // UUID
    room_id: string; // UUID
    status: SessionStatus;
    start_time: string; // TIMESTAMPTZ
    end_time: string | null; // TIMESTAMPTZ
    video_id: string | null; // UUID
    playback_url?: string | null; // 回放播放地址（后端动态返回）
    created_at: string; // TIMESTAMPTZ
    updated_at: string; // TIMESTAMPTZ
    statistics?: Statistics; // 关联的统计数据，可选
    room_title?: string; // 用于UI展示，非数据库字段
  }

/**
 * 创建新场次时需要发送的数据载荷
 */
export interface SessionCreatePayload {
  start_time: string; // 格式应为 ISO 8601, e.g., "2025-07-23T10:00:00Z"
  playback_url?: string | null; // 可选：直接指定回放/播放地址
  // status?: string; // 如有需要可加
}
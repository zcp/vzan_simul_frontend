// 文件路径: d:\live_static_viewer\src\utils\csv.ts
import Papa from 'papaparse';

export interface LiveRecord {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  views: number;
  m3u8_url: string;
  description: string;
  clipUrl?: string;
  status?: string;
}


let cachedData: LiveRecord[] | null = null;
let cachedYfpData: LiveRecord[] | null = null;
let cachedSSZBData: LiveRecord[] | null = null;
let cachedQQSRXData: LiveRecord[] | null = null;
let cachedXJGData: LiveRecord[] | null = null;

export async function loadCSV(): Promise<LiveRecord[]> {
  if (cachedData) return cachedData;

  const response = await fetch('/面对面.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<any>) => {
        const mappedData: LiveRecord[] = results.data.map((row: any) => {
          let thumbnailUrl = (row['封面图片'] || row['封面URL'] || '').trim();
          
          if (thumbnailUrl.includes('vzan.com')) {
            const urlMatch = thumbnailUrl.match(/https?:\/\/[^\/]+(.*)/);
            if (urlMatch && urlMatch[1]) {
              const path = urlMatch[1].replace(/\|/g, '&');
              thumbnailUrl = `/api/image${path}`;
            }
          } else {
            thumbnailUrl = thumbnailUrl.replace(/\|/g, '&');
          }
          
          return {
            id: String(row['直播间ID'] || ''),
            title: row['标题'] || '',
            thumbnail: thumbnailUrl,
            date: row['开始时间'] || '',
            views: parseInt(row['观看次数'] || '0', 10) || 0,
            m3u8_url: row['原始回放URL'] || row['播放url'] || row['视频源URL'] || '',
            description: row['标题'] || '',
            clipUrl: row['剪辑回放URL'] || '',
            status: '回放中'
          };
        });
        cachedData = mappedData.filter(r => r.id && r.title);
        resolve(cachedData!);
      },
      error: (error: any) => reject(error)
    });
  });
}
export async function loadYfpCSV(): Promise<LiveRecord[]> {
  if (cachedYfpData) return cachedYfpData;

  const response = await fetch('/云复盘.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<any>) => {
        const mappedData: LiveRecord[] = results.data.map((row: any) => {
          let thumbnailUrl = (row['封面图片'] || row['封面URL'] || '').trim();

          if (thumbnailUrl.includes('vzan.com')) {
            const urlMatch = thumbnailUrl.match(/https?:\/\/[^\/]+(.*)/);
            if (urlMatch && urlMatch[1]) {
              const path = urlMatch[1].replace(/\|/g, '&');
              thumbnailUrl = `/api/image${path}`;
            }
          } else {
            thumbnailUrl = thumbnailUrl.replace(/\|/g, '&');
          }

          return {
            id: String(row['直播间ID'] || ''),
            title: row['标题'] || '',
            thumbnail: thumbnailUrl,
            date: row['开始时间'] || '',
            views: parseInt(row['观看次数'] || '0', 10) || 0,
            m3u8_url: row['原始回放URL'] || row['播放url'] || row['视频源URL'] || '',
            description: row['标题'] || '',
            clipUrl: row['剪辑回放URL'] || '',
            status: '回放中', // 你之前已经这样写，保持一致
          };
        });
        cachedYfpData = mappedData.filter(r => r.id && r.title);
        resolve(cachedYfpData!);
      },
      error: (error: any) => reject(error),
    });
  });
}
export async function loadSSZBCSV(): Promise<LiveRecord[]> {
  if (cachedSSZBData) return cachedSSZBData;

  const response = await fetch('/手术直播.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<any>) => {
        const mappedData: LiveRecord[] = results.data.map((row: any) => {
          let thumbnailUrl = (row['封面图片'] || row['封面URL'] || '').trim();

          if (thumbnailUrl.includes('vzan.com')) {
            const urlMatch = thumbnailUrl.match(/https?:\/\/[^\/]+(.*)/);
            if (urlMatch && urlMatch[1]) {
              const path = urlMatch[1].replace(/\|/g, '&');
              thumbnailUrl = `/api/image${path}`;
            }
          } else {
            thumbnailUrl = thumbnailUrl.replace(/\|/g, '&');
          }

          return {
            id: String(row['直播间ID'] || ''),
            title: row['标题'] || '',
            thumbnail: thumbnailUrl,
            date: row['开始时间'] || '',
            views: parseInt(row['观看次数'] || '0', 10) || 0,
            m3u8_url: row['原始回放URL'] || row['播放url'] || row['视频源URL'] || '',
            description: row['标题'] || '',
            clipUrl: row['剪辑回放URL'] || '',
            status: '回放中',
          };
        });
        cachedSSZBData = mappedData.filter(r => r.id && r.title);
        resolve(cachedSSZBData!);
      },
      error: (error: any) => reject(error),
    });
  });
}
export async function loadQQSRXCSV(): Promise<LiveRecord[]> {
  if (cachedQQSRXData) return cachedQQSRXData;

  const response = await fetch('/腔腔三人行.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<any>) => {
        const mappedData: LiveRecord[] = results.data.map((row: any) => {
          let thumbnailUrl = (row['封面图片'] || row['封面URL'] || '').trim();

          if (thumbnailUrl.includes('vzan.com')) {
            const urlMatch = thumbnailUrl.match(/https?:\/\/[^\/]+(.*)/);
            if (urlMatch && urlMatch[1]) {
              const path = urlMatch[1].replace(/\|/g, '&');
              thumbnailUrl = `/api/image${path}`;
            }
          } else {
            thumbnailUrl = thumbnailUrl.replace(/\|/g, '&');
          }

          return {
            id: String(row['直播间ID'] || ''),
            title: row['标题'] || '',
            thumbnail: thumbnailUrl,
            date: row['开始时间'] || '',
            views: parseInt(row['观看次数'] || '0', 10) || 0,
            m3u8_url: row['原始回放URL'] || row['播放url'] || row['视频源URL'] || '',
            description: row['标题'] || '',
            clipUrl: row['剪辑回放URL'] || '',
            status: '回放中',
          };
        });
        cachedQQSRXData = mappedData.filter(r => r.id && r.title);
        resolve(cachedQQSRXData!);
      },
      error: (error: any) => reject(error),
    });
  });
}
export async function loadXJGCSV(): Promise<LiveRecord[]> {
  if (cachedXJGData) return cachedXJGData;

  const response = await fetch('/小君肝.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<any>) => {
        const mappedData: LiveRecord[] = results.data.map((row: any) => {
          let thumbnailUrl = (row['封面图片'] || row['封面URL'] || '').trim();

          if (thumbnailUrl.includes('vzan.com')) {
            const urlMatch = thumbnailUrl.match(/https?:\/\/[^\/]+(.*)/);
            if (urlMatch && urlMatch[1]) {
              const path = urlMatch[1].replace(/\|/g, '&');
              thumbnailUrl = `/api/image${path}`;
            }
          } else {
            thumbnailUrl = thumbnailUrl.replace(/\|/g, '&');
          }

          return {
            id: String(row['直播间ID'] || ''),
            title: row['标题'] || '',
            thumbnail: thumbnailUrl,
            date: row['开始时间'] || '',
            views: parseInt(row['观看次数'] || '0', 10) || 0,
            m3u8_url: row['播放url'] || row['原始回放URL'] || '',
            description: row['标题'] || '',
            clipUrl: row['剪辑回放URL'] || '',
            status: '回放中',
          };
        });
        cachedXJGData = mappedData.filter(r => r.id && r.title);
        resolve(cachedXJGData!);
      },
      error: (error: any) => reject(error),
    });
  });
}
export async function getRecordById(id: string): Promise<LiveRecord | null> {
  const records = await loadCSV();
  return records.find(r => r.id.toString() === id.toString()) || null;
}
export async function getYfpRecordById(id: string): Promise<LiveRecord | null> {
  const records = await loadYfpCSV();
  return records.find(r => r.id.toString() === id.toString()) || null;
}
export async function getSSZBRecordById(id: string): Promise<LiveRecord | null> {
  const records = await loadSSZBCSV();
  return records.find(r => r.id.toString() === id.toString()) || null;
}
export async function getQQSRXRecordById(id: string): Promise<LiveRecord | null> {
  const records = await loadQQSRXCSV();
  return records.find(r => r.id.toString() === id.toString()) || null;
}
export async function getXJGRecordById(id: string): Promise<LiveRecord | null> {
  const records = await loadXJGCSV();
  return records.find(r => r.id.toString() === id.toString()) || null;
}
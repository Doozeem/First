export type ContentType = 'Promotion' | 'Story' | 'Web Showcase';
export type Language = 'id' | 'en';

export interface PromoRequest {
  contentType: ContentType;
  productName: string; 
  description: string; 
  targetAudience: string;
  platform: 'Instagram' | 'LinkedIn' | 'Twitter' | 'Email' | 'TikTok Script' | 'YouTube Shorts';
  tone: string;
  language: Language;
}

export interface PromoResponse {
  content: string;
}

export interface VideoAnalysisResult {
  productName: string;
  description: string;
  targetAudience: string;
}

export enum AudioStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}
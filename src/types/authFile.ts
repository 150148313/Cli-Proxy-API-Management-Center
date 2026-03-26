/**
 * 认证文件相关类型
 * 基于原项目 src/modules/auth-files.js
 */

export type AuthFileType =
  | 'qwen'
  | 'kimi'
  | 'gemini'
  | 'gemini-cli'
  | 'aistudio'
  | 'claude'
  | 'codex'
  | 'antigravity'
  | 'iflow'
  | 'vertex'
  | 'empty'
  | 'unknown';

export interface AuthFileItem {
  name: string;
  type?: AuthFileType | string;
  provider?: string;
  size?: number;
  authIndex?: string | number | null;
  runtimeOnly?: boolean | string;
  disabled?: boolean;
  unavailable?: boolean;
  status?: string;
  statusMessage?: string;
  lastErrorHttpStatus?: number | null;
  lastErrorMessage?: string;
  lastRefresh?: string | number;
  modified?: number;
  [key: string]: unknown;
}

export interface AuthFilesCleanupFailedItem {
  name: string;
  error: string;
}

export interface AuthFilesCleanupResponse {
  status?: string;
  matched: number;
  deleted: number;
  files: string[];
  failed: AuthFilesCleanupFailedItem[];
  dryRun: boolean;
}

export interface AuthFilesResponse {
  files: AuthFileItem[];
  total?: number;
}

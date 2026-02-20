// Training / Knowledge Base types matching backend models

export type SourceType = "internal" | "external";
export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface KnowledgeSource {
  id: number;
  source_type: SourceType;
  name: string;
  source_location?: string | null;
  last_synced_at?: string | null;
  created_at?: string;
}

export interface KnowledgeSourceCreateRequest {
  chatbot_id: number;
  source_type: SourceType;
  name: string;
  source_location?: string;
}

export interface Document {
  id: number;
  title: string;
  raw_text?: string | null;
  checksum: string;
  status: DocumentStatus;
  error_message?: string | null;
  created_at?: string;
}

export interface DocumentCreateRequest {
  source_id: number;
  title: string;
  raw_text?: string;
  file?: File;
}

export interface ChunkingRequest {
  chunk_size?: number;
  overlap?: number;
}

export interface ChunkingResponse {
  status: string;
  chunks_count: number;
}

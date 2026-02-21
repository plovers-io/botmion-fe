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
  chatbot?: number;
}

export interface KnowledgeSourceCreateRequest {
  chatbot_id: number;
  source_type: SourceType;
  name: string;
  source_location?: string;
}

export interface Document {
  id: number;
  source: number;
  title: string;
  raw_text?: string | null;
  file?: string | null;
  checksum: string;
  status: DocumentStatus;
  error_message?: string | null;
  created_at?: string;
}

/** Extended document returned by GET /bots/v1/documents/:id/ */
export interface DocumentDetail extends Document {
  chunks_count: number;
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


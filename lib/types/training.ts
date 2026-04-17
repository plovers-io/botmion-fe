// Training / Knowledge Base types matching backend models

export type SourceType = "internal" | "external";
export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface KnowledgeSource {
  id: number;
  chatbot: number;
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
  source: number;
  title: string;
  raw_text?: string | null;
  file?: string | null;
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
  url?: string;
  qa_pairs?: QAPair[];
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface ChunkingRequest {
  chunk_size?: number;
  overlap?: number;
}

export interface ChunkingResponse {
  status: string;
  chunks_count: number;
}

export interface ImageDocument {
  id: number;
  source: number;
  title: string;
  image_file: string;
  metadata?: Record<string, unknown>;
  thumbnail?: string | null;
  width?: number | null;
  height?: number | null;
  file_format?: string | null;
  file_size?: number | null;
  checksum: string;
  status: DocumentStatus;
  error_message?: string | null;
  processed_at?: string | null;
  embedding_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImageDocumentCreateRequest {
  source_id: number;
  title: string;
  image_file: File;
  metadata?: Record<string, unknown>;
}

export interface PaginatedImageDocuments {
  count: number;
  next: string | null;
  previous: string | null;
  results: ImageDocument[];
}


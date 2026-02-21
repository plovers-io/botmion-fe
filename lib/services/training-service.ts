import { apiClient } from "./api-client";
import {
  KnowledgeSource,
  KnowledgeSourceCreateRequest,
  Document,
  DocumentCreateRequest,
  DocumentDetail,
  ChunkingRequest,
  ChunkingResponse,
} from "@/lib/types/training";

const BOTS_BASE =
  process.env.NEXT_PUBLIC_BOTS_URL || "http://localhost:8000/bots";

export class TrainingService {
  // ─── Knowledge Sources ──────────────────────────────────────────────

  /**
   * List all knowledge sources for the authenticated user's chatbots
   * GET /bots/v1/knowledge-sources/
   */
  static async getKnowledgeSources(): Promise<KnowledgeSource[]> {
    const response = await apiClient.get<KnowledgeSource[]>(
      `${BOTS_BASE}/v1/knowledge-sources/`
    );
    return response.data;
  }

  /**
   * Get a single knowledge source by ID
   * GET /bots/v1/knowledge-sources/:id/
   */
  static async getKnowledgeSource(id: number): Promise<KnowledgeSource> {
    const response = await apiClient.get<KnowledgeSource>(
      `${BOTS_BASE}/v1/knowledge-sources/${id}/`
    );
    return response.data;
  }

  /**
   * Create a new knowledge source for a chatbot
   * POST /bots/v1/knowledge-sources/
   */
  static async createKnowledgeSource(
    data: KnowledgeSourceCreateRequest
  ): Promise<KnowledgeSource> {
    const response = await apiClient.post<KnowledgeSource>(
      `${BOTS_BASE}/v1/knowledge-sources/`,
      data
    );
    return response.data;
  }

  /**
   * Update a knowledge source
   * PUT /bots/v1/knowledge-sources/:id/
   */
  static async updateKnowledgeSource(
    id: number,
    data: Partial<KnowledgeSourceCreateRequest>
  ): Promise<KnowledgeSource> {
    const response = await apiClient.put<KnowledgeSource>(
      `${BOTS_BASE}/v1/knowledge-sources/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * Delete a knowledge source
   * DELETE /bots/v1/knowledge-sources/:id/
   */
  static async deleteKnowledgeSource(id: number): Promise<void> {
    await apiClient.delete(`${BOTS_BASE}/v1/knowledge-sources/${id}/`);
  }

  // ─── Documents ──────────────────────────────────────────────────────

  /**
   * List all documents (optionally filtered by source_id)
   * GET /bots/v1/documents/?source_id=<id>
   */
  static async getDocuments(sourceId?: number): Promise<Document[]> {
    const params = sourceId ? `?source_id=${sourceId}` : "";
    const response = await apiClient.get<Document[]>(
      `${BOTS_BASE}/v1/documents/${params}`
    );
    return response.data;
  }

  /**
   * Get a single document with its chunks count
   * GET /bots/v1/documents/:id/
   */
  static async getDocument(id: number): Promise<DocumentDetail> {
    const response = await apiClient.get<DocumentDetail>(
      `${BOTS_BASE}/v1/documents/${id}/`
    );
    return response.data;
  }

  /**
   * Create a document (file upload or raw text)
   * POST /bots/v1/documents/
   */
  static async createDocument(data: DocumentCreateRequest): Promise<Document> {
    const formData = new FormData();
    formData.append("source_id", String(data.source_id));
    formData.append("title", data.title);
    if (data.raw_text) formData.append("raw_text", data.raw_text);
    if (data.file) formData.append("file", data.file);

    const response = await apiClient.post<Document>(
      `${BOTS_BASE}/v1/documents/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  }

  /**
   * Delete a document
   * DELETE /bots/v1/documents/:id/
   */
  static async deleteDocument(id: number): Promise<void> {
    await apiClient.delete(`${BOTS_BASE}/v1/documents/${id}/`);
  }

  // ─── Chunking & Training ───────────────────────────────────────────

  /**
   * Trigger document chunking + embedding (the actual "training")
   * POST /bots/v1/documents/:id/chunk/
   */
  static async trainDocument(
    documentId: number,
    options?: ChunkingRequest
  ): Promise<ChunkingResponse> {
    const response = await apiClient.post<ChunkingResponse>(
      `${BOTS_BASE}/v1/documents/${documentId}/chunk/`,
      options || {}
    );
    return response.data;
  }
}


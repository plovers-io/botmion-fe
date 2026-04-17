import { apiClient } from "./api-client";
import {
  KnowledgeSource,
  KnowledgeSourceCreateRequest,
  Document,
  DocumentCreateRequest,
  ChunkingRequest,
  ChunkingResponse,
  ImageDocument,
  ImageDocumentCreateRequest,
  PaginatedImageDocuments,
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
   * Get a single document by ID
   * GET /bots/v1/documents/:id/
   */
  static async getDocument(id: number): Promise<Document> {
    const response = await apiClient.get<Document>(
      `${BOTS_BASE}/v1/documents/${id}/`
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

  /**
   * Create a document (file upload, raw text, URL, or Q&A pairs)
   * POST /bots/v1/documents/
   */
  static async createDocument(data: DocumentCreateRequest): Promise<Document> {
    const formData = new FormData();
    formData.append("source_id", String(data.source_id));
    formData.append("title", data.title);
    if (data.raw_text) formData.append("raw_text", data.raw_text);
    if (data.file) formData.append("file", data.file);
    if (data.url) formData.append("url", data.url);
    if (data.qa_pairs) formData.append("qa_pairs", JSON.stringify(data.qa_pairs));

    const response = await apiClient.post<Document>(
      `${BOTS_BASE}/v1/documents/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
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

  // ─── Image Documents ───────────────────────────────────────────────

  /**
   * List image documents (paginated in backend)
   * GET /bots/v1/image-documents/
   */
  static async getImageDocuments(pageSize = 100): Promise<ImageDocument[]> {
    const response = await apiClient.get<PaginatedImageDocuments | ImageDocument[]>(
      `${BOTS_BASE}/v1/image-documents/?page_size=${pageSize}`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  }

  /**
   * Create a new image document
   * POST /bots/v1/image-documents/
   */
  static async createImageDocument(data: ImageDocumentCreateRequest): Promise<ImageDocument> {
    const formData = new FormData();
    formData.append("source_id", String(data.source_id));
    formData.append("title", data.title);
    formData.append("image_file", data.image_file);
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      formData.append("metadata", JSON.stringify(data.metadata));
    }

    const response = await apiClient.post<ImageDocument>(
      `${BOTS_BASE}/v1/image-documents/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  }

  /**
   * Delete an image document
   * DELETE /bots/v1/image-documents/:id/
   */
  static async deleteImageDocument(id: number): Promise<void> {
    await apiClient.delete(`${BOTS_BASE}/v1/image-documents/${id}/`);
  }

  /**
   * Trigger image embedding processing
   * POST /bots/v1/image-documents/:id/process/
   */
  static async processImageDocument(id: number): Promise<{ status: string; message: string }> {
    const response = await apiClient.post<{ status: string; message: string }>(
      `${BOTS_BASE}/v1/image-documents/${id}/process/`,
      {}
    );
    return response.data;
  }
}


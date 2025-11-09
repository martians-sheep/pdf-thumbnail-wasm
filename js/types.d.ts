/**
 * TypeScript type definitions for pdf-thumbnail-wasm
 */

/**
 * Image format options
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Options for thumbnail generation
 */
export interface ThumbnailOptions {
  /** Page number (1-indexed, default: 1) */
  page?: number;
  /** Output width in pixels (default: 400) */
  width?: number;
  /** Output height in pixels (auto if not specified) */
  height?: number;
  /** Output format (default: 'jpeg') */
  format?: ImageFormat;
  /** Quality for JPEG/WebP (1-100, default: 85) */
  quality?: number;
  /** Rendering scale factor (default: 2.0) */
  scale?: number;
}

/**
 * Size specification for batch generation
 */
export interface SizeSpec {
  /** Name identifier for this size */
  name: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Options for batch thumbnail generation
 */
export interface BatchOptions extends ThumbnailOptions {
  /** Array of page numbers to generate (if not specified, generates all pages) */
  pages?: number[];
  /** Array of size specifications */
  sizes?: SizeSpec[];
  /** Concurrency level (default: 4) */
  concurrency?: number;
}

/**
 * Information about a PDF page
 */
export interface PageInfo {
  /** Page number */
  page: number;
  /** Width in points */
  width: number;
  /** Height in points */
  height: number;
  /** Rotation in degrees */
  rotation: number;
}

/**
 * Result from streaming generation
 */
export interface StreamResult {
  /** Page number */
  page: number;
  /** Size name (if batch generation with multiple sizes) */
  size: string;
  /** Generated image data */
  data: Uint8Array;
}

/**
 * Main PDF thumbnail processor
 */
export declare class PdfThumbnail {
  /**
   * Create a new PdfThumbnail instance
   * @param pdfData - PDF file data as ArrayBuffer or Uint8Array
   */
  constructor(pdfData: ArrayBuffer | Uint8Array);

  /**
   * Get the total number of pages in the PDF
   */
  getPageCount(): number;

  /**
   * Get information about a specific page
   * @param page - Page number (1-indexed)
   */
  getPageInfo(page: number): PageInfo;

  /**
   * Generate a thumbnail for a single page
   * @param options - Thumbnail generation options
   * @returns Promise resolving to image data as Uint8Array
   */
  generateThumbnail(options?: ThumbnailOptions): Promise<Uint8Array>;

  /**
   * Generate multiple thumbnails in batch
   * @param options - Batch generation options
   * @returns Promise resolving to a Map of 'page-size' keys to image data
   */
  generateBatch(options?: BatchOptions): Promise<Map<string, Uint8Array>>;

  /**
   * Generate thumbnails as a stream
   * @param options - Batch generation options
   * @returns Async generator yielding thumbnail results
   */
  generateStream(options?: BatchOptions): AsyncGenerator<StreamResult>;

  /**
   * Dispose of resources and free memory
   * Should be called when done using the instance
   */
  dispose(): void;

  /**
   * Free the instance (alias for dispose)
   */
  free(): void;
}

/**
 * Initialize the WASM module
 * Must be called before creating any PdfThumbnail instances
 */
export default function init(input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module): Promise<void>;

/**
 * Re-export for convenience
 */
export { init };

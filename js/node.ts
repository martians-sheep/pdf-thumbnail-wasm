/**
 * Node.js-specific utilities for pdf-thumbnail-wasm
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';

export * from './index';

/**
 * Load PDF from file path
 * @param filePath - Path to PDF file
 * @returns PDF data as Uint8Array
 */
export async function loadPdfFromPath(filePath: string): Promise<Uint8Array> {
  const buffer = await readFile(filePath);
  return new Uint8Array(buffer);
}

/**
 * Save image data to file
 * @param data - Image data as Uint8Array
 * @param outputPath - Output file path
 */
export async function saveImageToFile(data: Uint8Array, outputPath: string): Promise<void> {
  // Ensure directory exists
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });

  // Write file
  await writeFile(outputPath, data);
}

/**
 * Extended PdfThumbnail class for Node.js with file system utilities
 * This will be implemented after wasm-pack generates the base bindings
 */
export class PdfThumbnailNode {
  // Will be implemented with proper inheritance from generated PdfThumbnail class

  /**
   * Create instance from file path
   * @param filePath - Path to PDF file
   */
  static async fromFile(filePath: string): Promise<any> {
    const pdfData = await loadPdfFromPath(filePath);
    // Return new PdfThumbnail(pdfData) after wasm-pack build
    throw new Error('Not implemented yet - run wasm-pack build first');
  }

  /**
   * Save thumbnail to file
   * @param outputPath - Output file path
   * @param options - Thumbnail options
   */
  async saveToFile(outputPath: string, options?: any): Promise<void> {
    // const data = await this.generateThumbnail(options);
    // await saveImageToFile(data, outputPath);
    throw new Error('Not implemented yet - run wasm-pack build first');
  }

  /**
   * Save batch thumbnails to directory
   * @param outputDir - Output directory
   * @param options - Batch options
   * @returns Array of saved file paths
   */
  async saveToDirectory(outputDir: string, options?: any): Promise<string[]> {
    // Implementation after wasm-pack build
    throw new Error('Not implemented yet - run wasm-pack build first');
  }
}

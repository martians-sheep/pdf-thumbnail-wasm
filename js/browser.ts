/**
 * Browser-specific utilities for pdf-thumbnail-wasm
 */

export * from './index';

/**
 * Load PDF from URL using fetch
 * @param url - URL to PDF file
 * @returns PDF data as Uint8Array
 */
export async function loadPdfFromUrl(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Load PDF from File object (e.g., from file input)
 * @param file - File object
 * @returns PDF data as Uint8Array
 */
export async function loadPdfFromFile(file: File): Promise<Uint8Array> {
  if (file.type !== 'application/pdf') {
    throw new Error('File is not a PDF');
  }
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Check if browser supports WASM
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    // Ignore
  }
  return false;
}

/**
 * Check if browser supports SharedArrayBuffer (for better performance)
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

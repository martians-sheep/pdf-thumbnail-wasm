mod utils;
mod types;
mod pdf_renderer;
mod image_processor;

use wasm_bindgen::prelude::*;
use types::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Initialize the WASM module
/// This should be called before any other functions
#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages in the browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    utils::log("pdf-thumbnail-wasm initialized");
}

/// PdfThumbnail processor
/// Main class for generating thumbnails from PDF documents
#[wasm_bindgen]
pub struct PdfThumbnail {
    pdf_data: Vec<u8>,
    page_count: u32,
}

#[wasm_bindgen]
impl PdfThumbnail {
    /// Create a new PdfThumbnail instance from PDF data
    #[wasm_bindgen(constructor)]
    pub fn new(pdf_data: &[u8]) -> Result<PdfThumbnail, JsValue> {
        utils::log(&format!("Creating PdfThumbnail with {} bytes", pdf_data.len()));

        // For now, we'll create a placeholder implementation
        // In Phase 1, we'll integrate actual PDF rendering
        let page_count = 10; // Placeholder

        Ok(PdfThumbnail {
            pdf_data: pdf_data.to_vec(),
            page_count,
        })
    }

    /// Get the total number of pages in the PDF
    #[wasm_bindgen(js_name = getPageCount)]
    pub fn get_page_count(&self) -> u32 {
        self.page_count
    }

    /// Get information about a specific page
    #[wasm_bindgen(js_name = getPageInfo)]
    pub fn get_page_info(&self, page: u32) -> Result<JsValue, JsValue> {
        if page < 1 || page > self.page_count {
            return Err(JsValue::from_str(&format!(
                "Page {} out of range (1-{})",
                page, self.page_count
            )));
        }

        let info = PageInfo {
            page,
            width: 595.0,  // A4 width in points (placeholder)
            height: 842.0, // A4 height in points (placeholder)
            rotation: 0,
        };

        serde_wasm_bindgen::to_value(&info)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Generate a thumbnail for a single page
    #[wasm_bindgen(js_name = generateThumbnail)]
    pub async fn generate_thumbnail(&self, options: JsValue) -> Result<Vec<u8>, JsValue> {
        let opts: ThumbnailOptions = serde_wasm_bindgen::from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;

        utils::log(&format!(
            "Generating thumbnail for page {} with width {}",
            opts.page, opts.width
        ));

        // Validate page number
        if opts.page < 1 || opts.page > self.page_count {
            return Err(JsValue::from_str(&format!(
                "Page {} out of range (1-{})",
                opts.page, self.page_count
            )));
        }

        // For now, generate a placeholder image
        // In Phase 1, we'll implement actual PDF rendering
        image_processor::generate_placeholder_image(&opts)
            .map_err(|e| JsValue::from_str(&format!("Image generation error: {}", e)))
    }

    /// Dispose of the PdfThumbnail instance and free memory
    #[wasm_bindgen]
    pub fn dispose(self) {
        utils::log("PdfThumbnail disposed");
        // Memory will be automatically freed when the struct is dropped
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_page_count() {
        let pdf_data = vec![0u8; 100];
        let thumbnail = PdfThumbnail::new(&pdf_data).unwrap();
        assert_eq!(thumbnail.get_page_count(), 10);
    }
}

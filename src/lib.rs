mod utils;
mod types;
mod pdf_renderer;
mod image_processor;

use wasm_bindgen::prelude::*;
use types::*;

/// WASMモジュールの初期化
/// 他の関数を呼び出す前に実行する必要があります
#[wasm_bindgen(start)]
pub fn init() {
    // ブラウザコンソールでのエラーメッセージ改善のためパニックフックを設定
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    utils::log("pdf-thumbnail-wasm initialized with Pdfium");
}

/// PDFサムネイル処理クラス
/// PDFドキュメントからサムネイルを生成するメインクラス
#[wasm_bindgen]
pub struct PdfThumbnail {
    renderer: pdf_renderer::PdfRenderer,
}

#[wasm_bindgen]
impl PdfThumbnail {
    /// PDFデータから新しいPdfThumbnailインスタンスを作成
    #[wasm_bindgen(constructor)]
    pub fn new(pdf_data: &[u8]) -> Result<PdfThumbnail, JsValue> {
        utils::log(&format!("Creating PdfThumbnail with {} bytes", pdf_data.len()));

        // PdfRendererを初期化（Pdfiumを使用）
        let renderer = pdf_renderer::PdfRenderer::new(pdf_data.to_vec())
            .map_err(|e| JsValue::from_str(&format!("PDF initialization error: {}", e)))?;

        utils::log(&format!("PDF loaded successfully with {} pages",
            renderer.get_page_count().unwrap_or(0)));

        Ok(PdfThumbnail { renderer })
    }

    /// PDFの総ページ数を取得
    #[wasm_bindgen(js_name = getPageCount)]
    pub fn get_page_count(&self) -> u32 {
        self.renderer.get_page_count().unwrap_or(0)
    }

    /// 特定のページに関する情報を取得
    #[wasm_bindgen(js_name = getPageInfo)]
    pub fn get_page_info(&self, page: u32) -> Result<JsValue, JsValue> {
        let page_count = self.get_page_count();

        if page < 1 || page > page_count {
            return Err(JsValue::from_str(&format!(
                "Page {} out of range (1-{})",
                page, page_count
            )));
        }

        let info = self.renderer.get_page_info(page)
            .map_err(|e| JsValue::from_str(&format!("Failed to get page info: {}", e)))?;

        serde_wasm_bindgen::to_value(&info)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// 単一ページのサムネイルを生成
    #[wasm_bindgen(js_name = generateThumbnail)]
    pub async fn generate_thumbnail(&self, options: JsValue) -> Result<Vec<u8>, JsValue> {
        let opts: ThumbnailOptions = serde_wasm_bindgen::from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;

        utils::log(&format!(
            "Generating thumbnail for page {} with width {}",
            opts.page, opts.width
        ));

        // ページ番号を検証
        let page_count = self.get_page_count();
        if opts.page < 1 || opts.page > page_count {
            return Err(JsValue::from_str(&format!(
                "Page {} out of range (1-{})",
                opts.page, page_count
            )));
        }

        // PDFページをレンダリング
        let raw_image = self.renderer.render_page(opts.page, opts.scale)
            .map_err(|e| JsValue::from_str(&format!("PDF rendering error: {}", e)))?;

        // 画像を処理してエンコード
        image_processor::process_image(raw_image, &opts)
            .map_err(|e| JsValue::from_str(&format!("Image processing error: {}", e)))
    }

    /// PdfThumbnailインスタンスを破棄してメモリを解放
    #[wasm_bindgen]
    pub fn dispose(self) {
        utils::log("PdfThumbnail disposed");
        // 構造体がドロップされると自動的にメモリが解放されます
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_structure() {
        // 基本的な構造テストのみ
        // 実際のPDFテストは統合テストで実施
        assert!(true);
    }
}

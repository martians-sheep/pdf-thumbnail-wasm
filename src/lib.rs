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
    pdf_data: Vec<u8>,
    page_count: u32,
}

#[wasm_bindgen]
impl PdfThumbnail {
    /// PDFデータから新しいPdfThumbnailインスタンスを作成
    #[wasm_bindgen(constructor)]
    pub fn new(pdf_data: &[u8]) -> Result<PdfThumbnail, JsValue> {
        utils::log(&format!("Creating PdfThumbnail with {} bytes", pdf_data.len()));

        // 現在はプレースホルダー実装
        // Phase 1で実際のPDFレンダリングを統合予定
        let page_count = 10; // プレースホルダー

        Ok(PdfThumbnail {
            pdf_data: pdf_data.to_vec(),
            page_count,
        })
    }

    /// PDFの総ページ数を取得
    #[wasm_bindgen(js_name = getPageCount)]
    pub fn get_page_count(&self) -> u32 {
        self.page_count
    }

    /// 特定のページに関する情報を取得
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
            width: 595.0,  // A4幅（ポイント単位、プレースホルダー）
            height: 842.0, // A4高さ（ポイント単位、プレースホルダー）
            rotation: 0,
        };

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
        if opts.page < 1 || opts.page > self.page_count {
            return Err(JsValue::from_str(&format!(
                "Page {} out of range (1-{})",
                opts.page, self.page_count
            )));
        }

        // 現在はプレースホルダー画像を生成
        // Phase 1で実際のPDFレンダリングを実装予定
        image_processor::generate_placeholder_image(&opts)
            .map_err(|e| JsValue::from_str(&format!("Image generation error: {}", e)))
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
    fn test_page_count() {
        let pdf_data = vec![0u8; 100];
        let thumbnail = PdfThumbnail::new(&pdf_data).unwrap();
        assert_eq!(thumbnail.get_page_count(), 10);
    }
}

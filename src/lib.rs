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

    utils::log("pdf-thumbnail-wasm initialized (using pdf.js for PDF rendering)");
}

/// 画像処理用のヘルパークラス
/// PDFレンダリングはJavaScript側（pdf.js）で行い、このクラスは画像処理のみを担当します
#[wasm_bindgen]
pub struct ImageProcessor;

#[wasm_bindgen]
impl ImageProcessor {
    /// Canvas ImageDataから画像を生成してエンコード
    /// JavaScript側でpdf.jsを使ってレンダリングしたImageDataを受け取ります
    #[wasm_bindgen(js_name = processImageData)]
    pub fn process_image_data(
        width: u32,
        height: u32,
        rgba_data: &[u8],
        target_width: u32,
        target_height: Option<u32>,
        format: &str,
        quality: u8,
    ) -> Result<Vec<u8>, JsValue> {
        utils::log(&format!(
            "Processing image: {}x{} -> {}x{}",
            width, height, target_width, target_height.unwrap_or(0)
        ));

        // RGBAからRGBに変換
        let mut rgb_data = Vec::with_capacity((width * height * 3) as usize);
        for chunk in rgba_data.chunks(4) {
            if chunk.len() >= 4 {
                rgb_data.push(chunk[0]); // R
                rgb_data.push(chunk[1]); // G
                rgb_data.push(chunk[2]); // B
                // chunk[3] はアルファチャンネル（無視）
            }
        }

        let raw_image = pdf_renderer::RawImage {
            width,
            height,
            data: rgb_data,
        };

        // ThumbnailOptionsを構築
        let image_format = match format {
            "png" => ImageFormat::Png,
            "webp" => ImageFormat::Webp,
            _ => ImageFormat::Jpeg,
        };

        let opts = ThumbnailOptions {
            page: 1, // 未使用
            width: target_width,
            height: target_height,
            format: image_format,
            quality,
            scale: 1.0, // 未使用（すでにレンダリング済み）
        };

        // 画像を処理してエンコード
        image_processor::process_image(raw_image, &opts)
            .map_err(|e| JsValue::from_str(&format!("Image processing error: {}", e)))
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

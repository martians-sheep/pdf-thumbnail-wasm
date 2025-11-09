use crate::types::*;
use pdfium_render::prelude::*;

/// PDFレンダラー
/// Pdfiumを使用してPDFレンダリングを処理します
pub struct PdfRenderer {
    pdfium: Pdfium,
    document: PdfDocument<'static>,
}

impl PdfRenderer {
    /// PDFデータから新しいレンダラーを作成
    pub fn new(pdf_data: Vec<u8>) -> Result<Self, String> {
        // WASMモード用にPdfiumを初期化
        // bind_to_system_library()を試みる
        let bindings = Pdfium::bind_to_system_library()
            .map_err(|e| format!("Pdfium initialization failed: {:?}", e))?;

        let mut pdfium = Pdfium::new(bindings);

        // PDFドキュメントを読み込む
        // ライフタイム問題を解決するため、unsafe transmute を使用
        let document = pdfium
            .load_pdf_from_byte_vec(pdf_data, None)
            .map_err(|e| format!("Failed to load PDF: {:?}", e))?;

        // ライフタイムを'staticに変換（注意: PdfRendererがドロップされるまでPdfiumを保持する必要がある）
        let document_static: PdfDocument<'static> = unsafe { std::mem::transmute(document) };

        Ok(Self {
            pdfium,
            document: document_static,
        })
    }

    /// PDFの総ページ数を取得
    pub fn get_page_count(&self) -> Result<u32, String> {
        Ok(self.document.pages().len() as u32)
    }

    /// 特定のページの情報を取得
    pub fn get_page_info(&self, page: u32) -> Result<PageInfo, String> {
        // ページインデックスは0ベース
        let page_index = (page - 1) as u16;

        let pdf_page = self.document
            .pages()
            .get(page_index)
            .map_err(|e| format!("Failed to get page {}: {:?}", page, e))?;

        let width = pdf_page.width().value;
        let height = pdf_page.height().value;
        let rotation = pdf_page
            .rotation()
            .map(|r| r.as_degrees() as i32)
            .unwrap_or(0);

        Ok(PageInfo {
            page,
            width,
            height,
            rotation,
        })
    }

    /// ページをレンダリングして生画像データを返す
    pub fn render_page(&self, page: u32, scale: f32) -> Result<RawImage, String> {
        // ページインデックスは0ベース
        let page_index = (page - 1) as u16;

        let pdf_page = self.document
            .pages()
            .get(page_index)
            .map_err(|e| format!("Failed to get page {}: {:?}", page, e))?;

        // ページサイズを取得してスケール適用
        let width = (pdf_page.width().value * scale) as u32;
        let height = (pdf_page.height().value * scale) as u32;

        // レンダリング設定
        let render_config = PdfRenderConfig::new()
            .set_target_width(width as i32)
            .set_maximum_height(height as i32)
            .rotate_if_landscape(PdfPageRenderRotation::None, true);

        // ページをビットマップにレンダリング
        let bitmap = pdf_page
            .render_with_config(&render_config)
            .map_err(|e| format!("Failed to render page {}: {:?}", page, e))?;

        // Pdfiumの出力はBGRA形式なので、RGB形式に変換
        let bgra_data = bitmap.as_raw_bytes();
        let mut rgb_data = Vec::with_capacity((width * height * 3) as usize);

        // BGRA → RGB 変換
        for chunk in bgra_data.chunks(4) {
            rgb_data.push(chunk[2]); // R
            rgb_data.push(chunk[1]); // G
            rgb_data.push(chunk[0]); // B
            // chunk[3] はアルファチャンネル（無視）
        }

        Ok(RawImage {
            width,
            height,
            data: rgb_data,
        })
    }
}

// Drop実装でクリーンアップ
impl Drop for PdfRenderer {
    fn drop(&mut self) {
        // PdfDocumentとPdfiumは自動的にクリーンアップされます
    }
}

/// 生の画像データ（RGB形式）
pub struct RawImage {
    pub width: u32,
    pub height: u32,
    pub data: Vec<u8>, // RGB形式（ピクセルあたり3バイト）
}

#[cfg(test)]
mod tests {
    use super::*;

    // 実際のPDFデータが必要なため、簡単なPDFを生成するヘルパーが必要
    // テストは統合テストで実施することを推奨

    #[test]
    fn test_raw_image_structure() {
        let image = RawImage {
            width: 100,
            height: 100,
            data: vec![255u8; 100 * 100 * 3],
        };
        assert_eq!(image.width, 100);
        assert_eq!(image.height, 100);
        assert_eq!(image.data.len(), 100 * 100 * 3);
    }
}

use serde::{Deserialize, Serialize};

/// サムネイル生成オプション
#[derive(Debug, Clone, Deserialize)]
pub struct ThumbnailOptions {
    /// ページ番号（1始まり）
    #[serde(default = "default_page")]
    pub page: u32,

    /// 出力幅（ピクセル単位）
    #[serde(default = "default_width")]
    pub width: u32,

    /// 出力高さ（ピクセル単位、未指定の場合は自動）
    #[serde(default)]
    pub height: Option<u32>,

    /// 出力フォーマット
    #[serde(default = "default_format")]
    pub format: ImageFormat,

    /// 品質（1-100、JPEG/WebP用）
    #[serde(default = "default_quality")]
    pub quality: u8,

    /// レンダリングスケール係数
    #[serde(default = "default_scale")]
    pub scale: f32,
}

impl Default for ThumbnailOptions {
    fn default() -> Self {
        Self {
            page: default_page(),
            width: default_width(),
            height: None,
            format: default_format(),
            quality: default_quality(),
            scale: default_scale(),
        }
    }
}

fn default_page() -> u32 {
    1
}

fn default_width() -> u32 {
    400
}

fn default_format() -> ImageFormat {
    ImageFormat::Jpeg
}

fn default_quality() -> u8 {
    85
}

fn default_scale() -> f32 {
    2.0
}

/// 画像フォーマット列挙型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    Jpeg,
    Png,
    Webp,
}

impl ImageFormat {
    pub fn mime_type(&self) -> &str {
        match self {
            ImageFormat::Jpeg => "image/jpeg",
            ImageFormat::Png => "image/png",
            ImageFormat::Webp => "image/webp",
        }
    }

    pub fn extension(&self) -> &str {
        match self {
            ImageFormat::Jpeg => "jpg",
            ImageFormat::Png => "png",
            ImageFormat::Webp => "webp",
        }
    }
}

/// ページ情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageInfo {
    pub page: u32,
    pub width: f32,
    pub height: f32,
    pub rotation: i32,
}

/// バッチ生成オプション
#[derive(Debug, Clone, Deserialize)]
pub struct BatchOptions {
    /// 生成するページ（未指定の場合は全ページを生成）
    #[serde(default)]
    pub pages: Option<Vec<u32>>,

    /// 生成する複数のサイズ
    #[serde(default)]
    pub sizes: Option<Vec<SizeSpec>>,

    /// 基本オプション
    #[serde(flatten)]
    pub base: ThumbnailOptions,

    /// 並列処理レベル
    #[serde(default = "default_concurrency")]
    pub concurrency: u32,
}

fn default_concurrency() -> u32 {
    4
}

/// バッチ生成用のサイズ指定
#[derive(Debug, Clone, Deserialize)]
pub struct SizeSpec {
    pub name: String,
    pub width: u32,
    pub height: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_format() {
        assert_eq!(ImageFormat::Jpeg.mime_type(), "image/jpeg");
        assert_eq!(ImageFormat::Png.mime_type(), "image/png");
        assert_eq!(ImageFormat::Webp.mime_type(), "image/webp");
    }

    #[test]
    fn test_default_options() {
        let opts = ThumbnailOptions::default();
        assert_eq!(opts.page, 1);
        assert_eq!(opts.width, 400);
        assert_eq!(opts.quality, 85);
        assert_eq!(opts.scale, 2.0);
    }
}

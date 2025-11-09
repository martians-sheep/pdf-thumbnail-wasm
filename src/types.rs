use serde::{Deserialize, Serialize};

/// Thumbnail generation options
#[derive(Debug, Clone, Deserialize)]
pub struct ThumbnailOptions {
    /// Page number (1-indexed)
    #[serde(default = "default_page")]
    pub page: u32,

    /// Output width in pixels
    #[serde(default = "default_width")]
    pub width: u32,

    /// Output height in pixels (auto if not specified)
    #[serde(default)]
    pub height: Option<u32>,

    /// Output format
    #[serde(default = "default_format")]
    pub format: ImageFormat,

    /// Quality (1-100) for JPEG/WebP
    #[serde(default = "default_quality")]
    pub quality: u8,

    /// Rendering scale factor
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

/// Image format enumeration
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

/// Page information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageInfo {
    pub page: u32,
    pub width: f32,
    pub height: f32,
    pub rotation: i32,
}

/// Batch generation options
#[derive(Debug, Clone, Deserialize)]
pub struct BatchOptions {
    /// Pages to generate (if not specified, generates all pages)
    #[serde(default)]
    pub pages: Option<Vec<u32>>,

    /// Multiple sizes to generate
    #[serde(default)]
    pub sizes: Option<Vec<SizeSpec>>,

    /// Base options
    #[serde(flatten)]
    pub base: ThumbnailOptions,

    /// Concurrency level
    #[serde(default = "default_concurrency")]
    pub concurrency: u32,
}

fn default_concurrency() -> u32 {
    4
}

/// Size specification for batch generation
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

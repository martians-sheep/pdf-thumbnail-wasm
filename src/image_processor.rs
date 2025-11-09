use crate::pdf_renderer::RawImage;
use crate::types::*;
use image::{ImageBuffer, ImageFormat as ImgFormat, Rgb};

/// 生画像データを指定されたフォーマットに処理・エンコード
pub fn process_image(raw: RawImage, options: &ThumbnailOptions) -> Result<Vec<u8>, String> {
    // 生データから画像バッファを作成
    let img = ImageBuffer::<Rgb<u8>, Vec<u8>>::from_raw(raw.width, raw.height, raw.data)
        .ok_or_else(|| "Failed to create image buffer".to_string())?;

    // 必要に応じてリサイズ
    let img = if let Some(target_height) = options.height {
        if raw.width != options.width || raw.height != target_height {
            image::imageops::resize(
                &img,
                options.width,
                target_height,
                image::imageops::FilterType::Lanczos3,
            )
        } else {
            img
        }
    } else if raw.width != options.width {
        // アスペクト比を維持して高さを自動計算
        let aspect_ratio = raw.height as f32 / raw.width as f32;
        let target_height = (options.width as f32 * aspect_ratio) as u32;
        image::imageops::resize(
            &img,
            options.width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        )
    } else {
        img
    };

    // 指定されたフォーマットにエンコード
    encode_image(img, options)
}

/// 画像を指定されたフォーマットにエンコード
fn encode_image(
    img: ImageBuffer<Rgb<u8>, Vec<u8>>,
    options: &ThumbnailOptions,
) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();
    let dynamic_img = image::DynamicImage::ImageRgb8(img);

    match options.format {
        ImageFormat::Jpeg => {
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                &mut buffer,
                options.quality,
            );
            encoder
                .encode_image(&dynamic_img)
                .map_err(|e| format!("JPEG encoding error: {}", e))?;
        }
        ImageFormat::Png => {
            dynamic_img
                .write_to(&mut std::io::Cursor::new(&mut buffer), ImgFormat::Png)
                .map_err(|e| format!("PNG encoding error: {}", e))?;
        }
        ImageFormat::Webp => {
            // 注: webpエンコードにはimageクレートのwebpフィーチャが必要
            // 現在はPNGにフォールバック
            dynamic_img
                .write_to(&mut std::io::Cursor::new(&mut buffer), ImgFormat::Png)
                .map_err(|e| format!("WebP encoding error (using PNG fallback): {}", e))?;
        }
    }

    Ok(buffer)
}

/// テスト用のプレースホルダー画像を生成
/// Phase 1で実際のPDFレンダリングに置き換えられます
pub fn generate_placeholder_image(options: &ThumbnailOptions) -> Result<Vec<u8>, String> {
    // サイズを計算
    let width = options.width;
    let height = if let Some(h) = options.height {
        h
    } else {
        // デフォルトはA4のアスペクト比（1:1.414）
        (width as f32 * 1.414) as u32
    };

    // シンプルなパターンでプレースホルダー画像を作成
    let mut img = ImageBuffer::new(width, height);

    // 白背景で塗りつぶし
    for pixel in img.pixels_mut() {
        *pixel = Rgb([255, 255, 255]);
    }

    // 枠線を追加
    let border = 10;
    for y in 0..height {
        for x in 0..width {
            if x < border || x >= width - border || y < border || y >= height - border {
                if let Some(pixel) = img.get_pixel_mut_checked(x, y) {
                    *pixel = Rgb([200, 200, 200]);
                }
            }
        }
    }

    // 見た目を良くするために斜め線を追加
    for i in 0..std::cmp::min(width, height) {
        if i % 20 == 0 {
            for offset in 0..2 {
                if i + offset < width && i + offset < height {
                    if let Some(pixel) = img.get_pixel_mut_checked(i + offset, i + offset) {
                        *pixel = Rgb([220, 220, 220]);
                    }
                }
            }
        }
    }

    // 要求されたフォーマットにエンコード
    encode_image(img, options)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_placeholder() {
        let options = ThumbnailOptions {
            page: 1,
            width: 400,
            height: Some(566),
            format: ImageFormat::Jpeg,
            quality: 85,
            scale: 2.0,
        };

        let result = generate_placeholder_image(&options);
        assert!(result.is_ok());

        let data = result.unwrap();
        assert!(!data.is_empty());
    }

    #[test]
    fn test_different_formats() {
        let formats = vec![ImageFormat::Jpeg, ImageFormat::Png, ImageFormat::Webp];

        for format in formats {
            let options = ThumbnailOptions {
                page: 1,
                width: 200,
                height: Some(283),
                format,
                quality: 85,
                scale: 1.0,
            };

            let result = generate_placeholder_image(&options);
            assert!(result.is_ok(), "Failed for format {:?}", format);
        }
    }
}

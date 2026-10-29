#include "ImageRenderer.hpp"
#include <algorithm>
#include <cwctype>

namespace GorselCevir {

ColorRGBA ColorRGBA::FromHex(std::wstring_view hex) {
    if (hex.empty()) return { 1.0f, 1.0f, 1.0f, 1.0f };
    std::wstring str(hex);
    if (str[0] == L'#') str = str.substr(1);

    if (str.length() == 6) {
        wchar_t* end = nullptr;
        unsigned long val = std::wcstoul(str.c_str(), &end, 16);
        float r = ((val >> 16) & 0xFF) / 255.0f;
        float g = ((val >> 8) & 0xFF) / 255.0f;
        float b = (val & 0xFF) / 255.0f;
        return { r, g, b, 1.0f };
    }
    return { 1.0f, 1.0f, 1.0f, 1.0f };
}

ImageRenderer::ImageRenderer(HWND hwnd, std::shared_ptr<FontMatcher> fontMatcher)
    : m_hwnd(hwnd), m_fontMatcher(std::move(fontMatcher)) {
}

bool ImageRenderer::Initialize() {
    // 1. Initialize Direct2D Factory
    D2D1_FACTORY_OPTIONS options{};
#if defined(_DEBUG)
    options.debugLevel = D2D1_DEBUG_LEVEL_INFORMATION;
#endif
    if (FAILED(D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, options, &m_d2dFactory))) {
        return false;
    }

    // 2. Initialize DirectWrite Factory
    if (FAILED(DWriteCreateFactory(
        DWRITE_FACTORY_TYPE_SHARED,
        __uuidof(IDWriteFactory),
        reinterpret_cast<IUnknown**>(m_dwriteFactory.GetAddressOf())
    ))) {
        return false;
    }

    // 3. Initialize WIC Factory for image loading
    if (FAILED(CoCreateInstance(
        CLSID_WICImagingFactory,
        nullptr,
        CLSCTX_INPROC_SERVER,
        IID_PPV_ARGS(&m_wicFactory)
    ))) {
        return false;
    }

    return CreateDeviceResources();
}

bool ImageRenderer::CreateDeviceResources() {
    if (m_renderTarget) return true;

    RECT rc;
    GetClientRect(m_hwnd, &rc);
    D2D1_SIZE_U size = D2D1::SizeU(rc.right - rc.left, rc.bottom - rc.top);

    D2D1_RENDER_TARGET_PROPERTIES rtProps = D2D1::RenderTargetProperties();
    D2D1_HWND_RENDER_TARGET_PROPERTIES hwndProps = D2D1::HwndRenderTargetProperties(m_hwnd, size);

    if (FAILED(m_d2dFactory->CreateHwndRenderTarget(rtProps, hwndProps, &m_renderTarget))) {
        return false;
    }

    // Create standard brushes
    m_renderTarget->CreateSolidColorBrush(D2D1::ColorF(D2D1::ColorF::White), &m_textBrush);
    m_renderTarget->CreateSolidColorBrush(D2D1::ColorF(0.1f, 0.15f, 0.25f, 0.95f), &m_bgBrush);
    m_renderTarget->CreateSolidColorBrush(D2D1::ColorF(0.0f, 0.0f, 0.0f, 1.0f), &m_strokeBrush);
    m_renderTarget->CreateSolidColorBrush(D2D1::ColorF(0.05f, 0.85f, 0.55f, 1.0f), &m_selectionBrush);

    return true;
}

void ImageRenderer::DiscardDeviceResources() {
    m_d2dBitmap.Reset();
    m_textBrush.Reset();
    m_bgBrush.Reset();
    m_strokeBrush.Reset();
    m_selectionBrush.Reset();
    m_renderTarget.Reset();
}

void ImageRenderer::OnResize(UINT width, UINT height) {
    if (m_renderTarget) {
        m_renderTarget->Resize(D2D1::SizeU(width, height));
    }
}

bool ImageRenderer::LoadImageFromFile(const std::wstring& path) {
    if (!m_wicFactory || !CreateDeviceResources()) return false;

    ComPtr<IWICBitmapDecoder> decoder;
    if (FAILED(m_wicFactory->CreateDecoderFromFilename(
        path.c_str(),
        nullptr,
        GENERIC_READ,
        WICDecodeMetadataCacheOnLoad,
        &decoder
    ))) {
        return false;
    }

    ComPtr<IWICBitmapFrameDecode> frame;
    if (FAILED(decoder->GetFrame(0, &frame))) return false;

    ComPtr<IWICFormatConverter> converter;
    if (FAILED(m_wicFactory->CreateFormatConverter(&converter))) return false;

    if (FAILED(converter->Initialize(
        frame.Get(),
        GUID_WICPixelFormat32bppPBGRA,
        WICBitmapDitherTypeNone,
        nullptr,
        0.0f,
        WICBitmapPaletteTypeMedianCut
    ))) {
        return false;
    }

    converter->GetSize(&m_imageWidth, &m_imageHeight);

    // Create D2D Bitmap from WIC source
    if (FAILED(m_renderTarget->CreateBitmapFromWicBitmap(converter.Get(), nullptr, &m_d2dBitmap))) {
        return false;
    }

    return true;
}

void ImageRenderer::Render(
    const std::vector<TextBlock>& blocks,
    ViewMode viewMode,
    float comparePosition,
    std::optional<size_t> selectedBlockIdx
) {
    if (!CreateDeviceResources()) return;

    m_renderTarget->BeginDraw();
    m_renderTarget->Clear(D2D1::ColorF(0.04f, 0.06f, 0.1f)); // Dark slate theme background

    D2D1_SIZE_F rtSize = m_renderTarget->GetSize();

    if (m_d2dBitmap && m_imageWidth > 0 && m_imageHeight > 0) {
        // Compute aspect-fit destination rect
        float scale = std::min(rtSize.width / m_imageWidth, rtSize.height / m_imageHeight);
        float destW = m_imageWidth * scale;
        float destH = m_imageHeight * scale;
        float destX = (rtSize.width - destW) / 2.0f;
        float destY = (rtSize.height - destH) / 2.0f;

        D2D1_RECT_F imageRect = D2D1::RectF(destX, destY, destX + destW, destY + destH);

        // 1. Draw Background Image
        m_renderTarget->DrawBitmap(m_d2dBitmap.Get(), imageRect);

        // 2. Draw Speech Bubbles & Translated Text Overlay
        for (size_t i = 0; i < blocks.size(); ++i) {
            const auto& block = blocks[i];
            if (!block.isVisible) continue;

            // Normalize coordinates from 0-1000 scale to canvas pixels
            float boxX = destX + (block.boundingBox.xmin / 1000.0f) * destW;
            float boxY = destY + (block.boundingBox.ymin / 1000.0f) * destH;
            float boxW = (block.boundingBox.Width() / 1000.0f) * destW;
            float boxH = (block.boundingBox.Height() / 1000.0f) * destH;

            D2D1_RECT_F blockRect = D2D1::RectF(boxX, boxY, boxX + boxW, boxY + boxH);
            D2D1_ROUNDED_RECT roundedRect = D2D1::RoundedRect(blockRect, 6.0f, 6.0f);

            // A. Draw Background speech bubble box
            ColorRGBA bgColor = block.customBgColor.value_or(block.backgroundColor);
            m_bgBrush->SetColor(bgColor.ToD2DColor());
            m_renderTarget->FillRoundedRectangle(roundedRect, m_bgBrush.Get());

            // B. Draw Outline Stroke
            if (block.hasStroke) {
                m_strokeBrush->SetColor(block.strokeColor.ToD2DColor());
                m_renderTarget->DrawRoundedRectangle(roundedRect, m_strokeBrush.Get(), block.strokeWidth);
            }

            // Selection Highlight
            if (selectedBlockIdx.has_value() && *selectedBlockIdx == i) {
                m_renderTarget->DrawRoundedRectangle(roundedRect, m_selectionBrush.Get(), 2.5f);
            }

            // C. Create DirectWrite Text Format for matched system font
            std::wstring fontName = block.customFontFamily.value_or(block.matchedSystemFont);
            if (fontName.empty()) fontName = L"Segoe UI";

            float fontSize = block.customFontSize.value_or(std::clamp(boxH * 0.45f, 10.0f, 48.0f));
            DWRITE_FONT_WEIGHT weight = block.isBold ? DWRITE_FONT_WEIGHT_BOLD : DWRITE_FONT_WEIGHT_NORMAL;
            DWRITE_FONT_STYLE style = block.isItalic ? DWRITE_FONT_STYLE_ITALIC : DWRITE_FONT_STYLE_NORMAL;

            ComPtr<IDWriteTextFormat> textFormat;
            if (SUCCEEDED(m_dwriteFactory->CreateTextFormat(
                fontName.c_str(),
                nullptr,
                weight,
                style,
                DWRITE_FONT_STRETCH_NORMAL,
                fontSize,
                L"tr-TR",
                &textFormat
            ))) {
                textFormat->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
                textFormat->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);

                // D. Draw Translated Text
                ColorRGBA txtColor = block.customTextColor.value_or(block.textColor);
                m_textBrush->SetColor(txtColor.ToD2DColor());

                m_renderTarget->DrawText(
                    block.translatedText.c_str(),
                    static_cast<UINT32>(block.translatedText.length()),
                    textFormat.Get(),
                    blockRect,
                    m_textBrush.Get()
                );
            }
        }
    }

    HRESULT hr = m_renderTarget->EndDraw();
    if (hr == D2DERR_RECREATE_TARGET) {
        DiscardDeviceResources();
    }
}

std::expected<void, std::wstring> ImageRenderer::ExportRenderedImage(
    const std::wstring& outputPath,
    const std::vector<TextBlock>& blocks,
    const ExportOptions& options
) {
    if (!m_d2dBitmap || m_imageWidth == 0 || m_imageHeight == 0) {
        return std::unexpected(L"Dışa aktarılacak bir görsel yüklü değil.");
    }

    // High Quality Resolution Scaling (1x, 2x, 4x)
    UINT targetW = static_cast<UINT>(m_imageWidth * options.scale);
    UINT targetH = static_cast<UINT>(m_imageHeight * options.scale);

    // In native Direct2D, create WIC Bitmap render target with target dimensions
    ComPtr<IWICBitmap> wicBitmap;
    if (FAILED(m_wicFactory->CreateBitmap(
        targetW, targetH,
        GUID_WICPixelFormat32bppPBGRA,
        WICBitmapCacheOnDemand,
        &wicBitmap
    ))) {
        return std::unexpected(L"Yüksek çözünürlüklü bellek yüzeyi oluşturulamadı.");
    }

    D2D1_RENDER_TARGET_PROPERTIES rtProps = D2D1::RenderTargetProperties(
        D2D1_RENDER_TARGET_TYPE_DEFAULT,
        D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED)
    );

    ComPtr<ID2D1RenderTarget> wicRt;
    if (FAILED(m_d2dFactory->CreateWicBitmapRenderTarget(wicBitmap.Get(), rtProps, &wicRt))) {
        return std::unexpected(L"Direct2D WIC render target oluşturulamadı.");
    }

    // Render scaled scene
    wicRt->BeginDraw();
    D2D1_RECT_F fullRect = D2D1::RectF(0.0f, 0.0f, static_cast<float>(targetW), static_cast<float>(targetH));
    wicRt->DrawBitmap(m_d2dBitmap.Get(), fullRect);

    // Render text blocks onto scaled canvas
    ComPtr<ID2D1SolidColorBrush> exportBgBrush;
    ComPtr<ID2D1SolidColorBrush> exportTxtBrush;
    wicRt->CreateSolidColorBrush(D2D1::ColorF(1.0f, 1.0f, 1.0f), &exportBgBrush);
    wicRt->CreateSolidColorBrush(D2D1::ColorF(0.0f, 0.0f, 0.0f), &exportTxtBrush);

    for (const auto& block : blocks) {
        if (!block.isVisible) continue;

        float boxX = (block.boundingBox.xmin / 1000.0f) * targetW;
        float boxY = (block.boundingBox.ymin / 1000.0f) * targetH;
        float boxW = (block.boundingBox.Width() / 1000.0f) * targetW;
        float boxH = (block.boundingBox.Height() / 1000.0f) * targetH;

        D2D1_ROUNDED_RECT roundedRect = D2D1::RoundedRect(D2D1::RectF(boxX, boxY, boxX + boxW, boxY + boxH), 8.0f, 8.0f);
        exportBgBrush->SetColor(block.backgroundColor.ToD2DColor());
        wicRt->FillRoundedRectangle(roundedRect, exportBgBrush.Get());

        float fontSize = std::clamp(boxH * 0.45f, 12.0f, 96.0f);
        ComPtr<IDWriteTextFormat> fmt;
        if (SUCCEEDED(m_dwriteFactory->CreateTextFormat(
            block.matchedSystemFont.c_str(),
            nullptr,
            block.isBold ? DWRITE_FONT_WEIGHT_BOLD : DWRITE_FONT_WEIGHT_NORMAL,
            DWRITE_FONT_STYLE_NORMAL,
            DWRITE_FONT_STRETCH_NORMAL,
            fontSize,
            L"tr-TR",
            &fmt
        ))) {
            fmt->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
            fmt->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
            exportTxtBrush->SetColor(block.textColor.ToD2DColor());
            wicRt->DrawText(
                block.translatedText.c_str(),
                static_cast<UINT32>(block.translatedText.length()),
                fmt.Get(),
                roundedRect.rect,
                exportTxtBrush.Get()
            );
        }
    }

    wicRt->EndDraw();

    // Save to file via WIC Encoder (PNG or JPEG)
    ComPtr<IWICStream> stream;
    if (FAILED(m_wicFactory->CreateStream(&stream))) {
        return std::unexpected(L"Dosya yazma akışı oluşturulamadı.");
    }
    if (FAILED(stream->InitializeFromFilename(outputPath.c_str(), GENERIC_WRITE))) {
        return std::unexpected(L"Hedef dosya açılamadı: " + outputPath);
    }

    GUID containerFormat = (options.format == ExportOptions::Format::JPEG) ? GUID_ContainerFormatJpeg : GUID_ContainerFormatPng;
    ComPtr<IWICBitmapEncoder> encoder;
    if (FAILED(m_wicFactory->CreateEncoder(containerFormat, nullptr, &encoder))) {
        return std::unexpected(L"Görsel kodlayıcı oluşturulamadı.");
    }
    if (FAILED(encoder->Initialize(stream.Get(), WICBitmapEncoderNoCache))) {
        return std::unexpected(L"Kodlayıcı başlatılamadı.");
    }

    ComPtr<IWICBitmapFrameEncode> frameEncode;
    if (FAILED(encoder->CreateNewFrame(&frameEncode, nullptr))) {
        return std::unexpected(L"Görsel karesi oluşturulamadı.");
    }
    if (FAILED(frameEncode->Initialize(nullptr))) {
        return std::unexpected(L"Görsel karesi başlatılamadı.");
    }
    if (FAILED(frameEncode->SetSize(targetW, targetH))) {
        return std::unexpected(L"Boyut ayarlanamadı.");
    }

    WICPixelFormatGUID pFormat = GUID_WICPixelFormat32bppBGRA;
    frameEncode->SetPixelFormat(&pFormat);
    if (FAILED(frameEncode->WriteSource(wicBitmap.Get(), nullptr))) {
        return std::unexpected(L"Piksel verisi yazılamadı.");
    }
    frameEncode->Commit();
    encoder->Commit();

    return {};
}

} // namespace GorselCevir

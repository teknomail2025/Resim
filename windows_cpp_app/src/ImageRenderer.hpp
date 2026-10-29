#pragma once

#include "Types.hpp"
#include "FontMatcher.hpp"
#include <string>
#include <vector>
#include <memory>
#include <expected>
#include <d2d1.h>
#include <dwrite.h>
#include <wincodec.h>

namespace GorselCevir {

class ImageRenderer {
public:
    ImageRenderer(HWND hwnd, std::shared_ptr<FontMatcher> fontMatcher);
    ~ImageRenderer() = default;

    // Non-copyable, movable (RAII)
    ImageRenderer(const ImageRenderer&) = delete;
    ImageRenderer& operator=(const ImageRenderer&) = delete;
    ImageRenderer(ImageRenderer&&) noexcept = default;
    ImageRenderer& operator=(ImageRenderer&&) noexcept = default;

    // Initializes Direct2D, DirectWrite, and WIC factories
    [[nodiscard]] bool Initialize();

    // Loads image from disk via WIC
    [[nodiscard]] bool LoadImageFromFile(const std::wstring& path);

    // Resizes render target on WM_SIZE
    void OnResize(UINT width, UINT height);

    // Renders the scene (Background image + translated text blocks)
    void Render(
        const std::vector<TextBlock>& blocks,
        ViewMode viewMode = ViewMode::PureImage,
        float comparePosition = 0.5f,
        std::optional<size_t> selectedBlockIdx = std::nullopt
    );

    // Exports the translated image to disk with 1x, 2x (Upscaler), or 4x scale
    [[nodiscard]] std::expected<void, std::wstring> ExportRenderedImage(
        const std::wstring& outputPath,
        const std::vector<TextBlock>& blocks,
        const ExportOptions& options
    );

    [[nodiscard]] bool HasImage() const noexcept { return m_d2dBitmap != nullptr; }
    [[nodiscard]] UINT GetImageWidth() const noexcept { return m_imageWidth; }
    [[nodiscard]] UINT GetImageHeight() const noexcept { return m_imageHeight; }

private:
    [[nodiscard]] bool CreateDeviceResources();
    void DiscardDeviceResources();

    HWND m_hwnd{ nullptr };
    std::shared_ptr<FontMatcher> m_fontMatcher;

    // Direct2D & DirectWrite & WIC COM interfaces (Managed via ComPtr, zero raw pointers)
    ComPtr<ID2D1Factory> m_d2dFactory;
    ComPtr<ID2D1HwndRenderTarget> m_renderTarget;
    ComPtr<IDWriteFactory> m_dwriteFactory;
    ComPtr<IWICImagingFactory> m_wicFactory;

    // Current Image Bitmap
    ComPtr<ID2D1Bitmap> m_d2dBitmap;
    UINT m_imageWidth{ 0 };
    UINT m_imageHeight{ 0 };

    // Standard brushes
    ComPtr<ID2D1SolidColorBrush> m_textBrush;
    ComPtr<ID2D1SolidColorBrush> m_bgBrush;
    ComPtr<ID2D1SolidColorBrush> m_strokeBrush;
    ComPtr<ID2D1SolidColorBrush> m_selectionBrush;
};

} // namespace GorselCevir

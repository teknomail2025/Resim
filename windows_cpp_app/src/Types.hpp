#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <cstdint>
#include <wrl/client.h>
#include <d2d1.h>
#include <dwrite.h>
#include <wincodec.h>

namespace GorselCevir {

// COM Smart pointer alias for RAII lifetime management (no raw pointers)
template <typename T>
using ComPtr = Microsoft::WRL::ComPtr<T>;

enum class FontCategory {
    SansSerif,
    Serif,
    Comic,
    Display,
    Handwriting,
    Monospace,
    Slab
};

enum class ViewMode {
    PureImage,
    ComparisonSlider,
    SideBySide,
    InteractiveOverlay
};

struct BoundingBox {
    float ymin{ 0.0f };
    float xmin{ 0.0f };
    float ymax{ 0.0f };
    float xmax{ 0.0f };

    [[nodiscard]] constexpr float Width() const noexcept { return xmax - xmin; }
    [[nodiscard]] constexpr float Height() const noexcept { return ymax - ymin; }
};

struct ColorRGBA {
    float r{ 1.0f };
    float g{ 1.0f };
    float b{ 1.0f };
    float a{ 1.0f };

    static ColorRGBA FromHex(std::wstring_view hex);
    [[nodiscard]] D2D1_COLOR_F ToD2DColor() const noexcept {
        return D2D1::ColorF(r, g, b, a);
    }
};

struct TextBlock {
    std::wstring id;
    std::wstring originalText;
    std::wstring translatedText;
    BoundingBox boundingBox; // 0.0f - 1000.0f normalized scale
    
    ColorRGBA textColor{ 1.0f, 1.0f, 1.0f, 1.0f };
    ColorRGBA backgroundColor{ 0.1f, 0.15f, 0.25f, 0.95f };
    
    bool isBold{ false };
    bool isItalic{ false };
    bool isUppercase{ false };
    bool hasStroke{ false };
    ColorRGBA strokeColor{ 0.0f, 0.0f, 0.0f, 1.0f };
    float strokeWidth{ 2.0f };
    
    FontCategory fontCategory{ FontCategory::SansSerif };
    std::wstring detectedFontName{ L"Standart Tipografi" };
    std::wstring matchedSystemFont{ L"Segoe UI" };
    int similarityScore{ 95 };
    
    // User manual overrides
    std::optional<float> customFontSize;
    std::optional<ColorRGBA> customTextColor;
    std::optional<ColorRGBA> customBgColor;
    std::optional<std::wstring> customFontFamily;
    bool isVisible{ true };
};

struct TranslationResult {
    std::wstring detectedLanguage{ L"Otomatik Algılandı" };
    std::wstring detectedLanguageCode{ L"auto" };
    std::wstring targetLanguage{ L"Türkçe" };
    std::wstring confidence{ L"%98" };
    std::wstring summary;
    std::vector<TextBlock> textBlocks;
};

struct ExportOptions {
    enum class Format { PNG, JPEG, WEBP } format{ Format::PNG };
    float scale{ 2.0f }; // 1.0x, 1.5x, 2.0x, 4.0x
    float quality{ 0.95f };
    bool enableUpscaler{ true };
};

} // namespace GorselCevir

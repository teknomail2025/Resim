#pragma once

#include "Types.hpp"
#include <string>
#include <vector>
#include <unordered_map>
#include <dwrite.h>

namespace GorselCevir {

class FontMatcher {
public:
    explicit FontMatcher(ComPtr<IDWriteFactory> dwriteFactory);
    ~FontMatcher() = default;

    // Non-copyable, movable (RAII)
    FontMatcher(const FontMatcher&) = delete;
    FontMatcher& operator=(const FontMatcher&) = delete;
    FontMatcher(FontMatcher&&) noexcept = default;
    FontMatcher& operator=(FontMatcher&&) noexcept = default;

    // Matches a font category to the best visually similar system font installed on Windows 10/11
    [[nodiscard]] std::wstring FindBestMatchingSystemFont(FontCategory category) const;

    // Checks if a font exists in the system font collection
    [[nodiscard]] bool IsFontInstalled(std::wstring_view fontName) const;

    // Get fallback system font
    [[nodiscard]] std::wstring GetDefaultSystemFont() const noexcept {
        return L"Segoe UI";
    }

private:
    void EnumerateSystemFonts();

    ComPtr<IDWriteFactory> m_dwriteFactory;
    ComPtr<IDWriteFontCollection> m_systemFontCollection;
    std::unordered_map<std::wstring, bool> m_installedFontCache;
};

} // namespace GorselCevir

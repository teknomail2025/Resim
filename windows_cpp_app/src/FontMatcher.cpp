#include "FontMatcher.hpp"
#include <array>
#include <algorithm>

namespace GorselCevir {

FontMatcher::FontMatcher(ComPtr<IDWriteFactory> dwriteFactory)
    : m_dwriteFactory(std::move(dwriteFactory)) {
    if (m_dwriteFactory) {
        m_dwriteFactory->GetSystemFontCollection(&m_systemFontCollection, FALSE);
        EnumerateSystemFonts();
    }
}

void FontMatcher::EnumerateSystemFonts() {
    if (!m_systemFontCollection) return;

    UINT32 familyCount = m_systemFontCollection->GetFontFamilyCount();
    for (UINT32 i = 0; i < familyCount; ++i) {
        ComPtr<IDWriteFontFamily> family;
        if (FAILED(m_systemFontCollection->GetFontFamily(i, &family))) continue;

        ComPtr<IDWriteLocalizedStrings> names;
        if (FAILED(family->GetFamilyNames(&names))) continue;

        UINT32 length = 0;
        if (FAILED(names->GetStringLength(0, &length))) continue;

        std::wstring name(length, L'\0');
        if (SUCCEEDED(names->GetString(0, name.data(), length + 1))) {
            m_installedFontCache[name] = true;
        }
    }
}

bool FontMatcher::IsFontInstalled(std::wstring_view fontName) const {
    auto it = m_installedFontCache.find(std::wstring(fontName));
    return it != m_installedFontCache.end() && it->second;
}

std::wstring FontMatcher::FindBestMatchingSystemFont(FontCategory category) const {
    // List of priority fonts per category available in Windows 10/11
    switch (category) {
        case FontCategory::Comic: {
            static const std::array<const wchar_t*, 4> comicFonts = {
                L"Comic Sans MS", L"Segoe Print", L"Ink Free", L"Trebuchet MS"
            };
            for (const auto* font : comicFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::Display: {
            static const std::array<const wchar_t*, 4> displayFonts = {
                L"Impact", L"Arial Black", L"Franklin Gothic Heavy", L"Trebuchet MS"
            };
            for (const auto* font : displayFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::Serif: {
            static const std::array<const wchar_t*, 4> serifFonts = {
                L"Georgia", L"Palatino Linotype", L"Times New Roman", L"Constantia"
            };
            for (const auto* font : serifFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::Handwriting: {
            static const std::array<const wchar_t*, 4> handFonts = {
                L"Segoe Print", L"Segoe Script", L"Ink Free", L"Comic Sans MS"
            };
            for (const auto* font : handFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::Monospace: {
            static const std::array<const wchar_t*, 4> monoFonts = {
                L"Consolas", L"Cascadia Code", L"Courier New", L"Lucida Console"
            };
            for (const auto* font : monoFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::Slab: {
            static const std::array<const wchar_t*, 3> slabFonts = {
                L"Rockwell", L"Georgia", L"Cambria"
            };
            for (const auto* font : slabFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
        case FontCategory::SansSerif:
        default: {
            static const std::array<const wchar_t*, 4> sansFonts = {
                L"Segoe UI", L"Segoe UI Variable Display", L"Calibri", L"Arial"
            };
            for (const auto* font : sansFonts) {
                if (IsFontInstalled(font)) return font;
            }
            break;
        }
    }

    return GetDefaultSystemFont();
}

} // namespace GorselCevir

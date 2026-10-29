#pragma once

#include "Types.hpp"
#include <string>
#include <vector>
#include <memory>
#include <expected>
#include <unordered_map>
#include <windows.h>
#include <winhttp.h>

namespace GorselCevir {

// RAII Wrapper for WinHTTP handles (never leaks HINTERNET)
struct WinHttpHandle {
    HINTERNET handle{ nullptr };

    WinHttpHandle() = default;
    explicit WinHttpHandle(HINTERNET h) noexcept : handle(h) {}
    ~WinHttpHandle() {
        if (handle) {
            WinHttpCloseHandle(handle);
            handle = nullptr;
        }
    }

    WinHttpHandle(const WinHttpHandle&) = delete;
    WinHttpHandle& operator=(const WinHttpHandle&) = delete;

    WinHttpHandle(WinHttpHandle&& other) noexcept : handle(other.handle) {
        other.handle = nullptr;
    }

    WinHttpHandle& operator=(WinHttpHandle&& other) noexcept {
        if (this != &other) {
            if (handle) WinHttpCloseHandle(handle);
            handle = other.handle;
            other.handle = nullptr;
        }
        return *this;
    }

    [[nodiscard]] explicit operator bool() const noexcept { return handle != nullptr; }
    [[nodiscard]] HINTERNET get() const noexcept { return handle; }
};

class TranslatorEngine {
public:
    TranslatorEngine();
    ~TranslatorEngine() = default;

    // Translates an image given file path or raw image bytes
    // Supports online AI processing via WinHTTP or complete offline fallback
    [[nodiscard]] std::expected<TranslationResult, std::wstring> TranslateImage(
        const std::wstring& imagePath,
        const std::wstring& targetLanguage = L"Turkish",
        const std::wstring& sourceLanguage = L"auto",
        bool forceOffline = false
    );

    // Creates an offline editing template when PC has no internet connection
    [[nodiscard]] TranslationResult CreateOfflineFallback(
        const std::wstring& filename,
        uint32_t imageWidth,
        uint32_t imageHeight
    ) const;

    // Checks local cache
    [[nodiscard]] bool HasCachedResult(const std::wstring& key) const;

private:
    std::unordered_map<std::wstring, TranslationResult> m_cache;
};

} // namespace GorselCevir

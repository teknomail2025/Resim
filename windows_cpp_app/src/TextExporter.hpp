#pragma once

#include "Types.hpp"
#include <string>
#include <filesystem>
#include <expected>
#include <system_error>

namespace GorselCevir {

class TextExporter {
public:
    TextExporter() = default;
    ~TextExporter() = default;

    // Generates an RFC 4180 compliant CSV string with UTF-8 BOM for Microsoft Excel
    [[nodiscard]] static std::string GenerateCSVString(
        const std::vector<TextBlock>& blocks,
        const TranslationResult& result
    );

    // Generates formatted JSON data
    [[nodiscard]] static std::string GenerateJSONString(
        const std::vector<TextBlock>& blocks,
        const TranslationResult& result
    );

    // Generates formatted plain text
    [[nodiscard]] static std::wstring GenerateTXTString(
        const std::vector<TextBlock>& blocks,
        const TranslationResult& result
    );

    // Exports to file with full error handling (std::expected, C++23)
    static std::expected<void, std::string> ExportToFile(
        const std::filesystem::path& path,
        std::string_view content
    );

    // Copies Unicode text directly to Windows Clipboard via Win32 API
    static bool CopyToClipboard(std::wstring_view text);

private:
    [[nodiscard]] static std::string EscapeCSV(std::string_view val);
};

} // namespace GorselCevir

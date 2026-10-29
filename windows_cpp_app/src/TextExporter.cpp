#include "TextExporter.hpp"
#include <fstream>
#include <sstream>
#include <iomanip>
#include <windows.h>

namespace GorselCevir {

namespace {
// Helper for UTF-16 std::wstring to UTF-8 std::string conversion using Win32 API
std::string WideToUtf8(std::wstring_view wstr) {
    if (wstr.empty()) return {};
    int sizeNeeded = WideCharToMultiByte(
        CP_UTF8, 0, wstr.data(), static_cast<int>(wstr.size()),
        nullptr, 0, nullptr, nullptr
    );
    if (sizeNeeded <= 0) return {};
    std::string result(sizeNeeded, '\0');
    WideCharToMultiByte(
        CP_UTF8, 0, wstr.data(), static_cast<int>(wstr.size()),
        result.data(), sizeNeeded, nullptr, nullptr
    );
    return result;
}

std::wstring Utf8ToWide(std::string_view str) {
    if (str.empty()) return {};
    int sizeNeeded = MultiByteToWideChar(
        CP_UTF8, 0, str.data(), static_cast<int>(str.size()),
        nullptr, 0
    );
    if (sizeNeeded <= 0) return {};
    std::wstring result(sizeNeeded, L'\0');
    MultiByteToWideChar(
        CP_UTF8, 0, str.data(), static_cast<int>(str.size()),
        result.data(), sizeNeeded
    );
    return result;
}
}

std::string TextExporter::EscapeCSV(std::string_view val) {
    bool needsQuotes = false;
    for (char c : val) {
        if (c == ',' || c == '"' || c == '\n' || c == '\r') {
            needsQuotes = true;
            break;
        }
    }

    if (!needsQuotes) {
        return std::string(val);
    }

    std::string result = "\"";
    for (char c : val) {
        if (c == '"') {
            result += "\"\"";
        } else {
            result += c;
        }
    }
    result += "\"";
    return result;
}

std::string TextExporter::GenerateCSVString(
    const std::vector<TextBlock>& blocks,
    const TranslationResult& result
) {
    std::ostringstream ss;
    // Prepend UTF-8 BOM (\xEF\xBB\xBF) so Excel opens UTF-8 characters without mojibake
    ss << "\xEF\xBB\xBF";

    // Headers
    ss << "Sira No,Orijinal Metin,Turkce Ceviri,Kategori,Algilanan Font,Eslesen Sistem Fontu,Benzerlik %,Kalinlik,Italik,Buyuk Harf,Ymin,Xmin,Ymax,Xmax,Blok ID\r\n";

    int index = 1;
    for (const auto& block : blocks) {
        ss << index++ << ",";
        ss << EscapeCSV(WideToUtf8(block.originalText)) << ",";
        ss << EscapeCSV(WideToUtf8(block.translatedText)) << ",";
        ss << EscapeCSV(WideToUtf8(block.detectedFontName)) << ",";
        ss << EscapeCSV(WideToUtf8(block.matchedSystemFont)) << ",";
        ss << block.similarityScore << "%,";
        ss << (block.isBold ? "Kalin" : "Normal") << ",";
        ss << (block.isItalic ? "Evet" : "Hayir") << ",";
        ss << (block.isUppercase ? "Evet" : "Hayir") << ",";
        ss << block.boundingBox.ymin << ",";
        ss << block.boundingBox.xmin << ",";
        ss << block.boundingBox.ymax << ",";
        ss << block.boundingBox.xmax << ",";
        ss << EscapeCSV(WideToUtf8(block.id)) << "\r\n";
    }

    return ss.str();
}

std::string TextExporter::GenerateJSONString(
    const std::vector<TextBlock>& blocks,
    const TranslationResult& result
) {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"app\": \"GorselCevir Windows Native\",\n";
    ss << "  \"version\": \"2.0.0\",\n";
    ss << "  \"detectedLanguage\": \"" << WideToUtf8(result.detectedLanguage) << "\",\n";
    ss << "  \"targetLanguage\": \"" << WideToUtf8(result.targetLanguage) << "\",\n";
    ss << "  \"confidence\": \"" << WideToUtf8(result.confidence) << "\",\n";
    ss << "  \"totalBlocks\": " << blocks.size() << ",\n";
    ss << "  \"textBlocks\": [\n";

    for (size_t i = 0; i < blocks.size(); ++i) {
        const auto& b = blocks[i];
        ss << "    {\n";
        ss << "      \"index\": " << (i + 1) << ",\n";
        ss << "      \"originalText\": \"" << WideToUtf8(b.originalText) << "\",\n";
        ss << "      \"translatedText\": \"" << WideToUtf8(b.translatedText) << "\",\n";
        ss << "      \"matchedFont\": \"" << WideToUtf8(b.matchedSystemFont) << "\",\n";
        ss << "      \"similarityScore\": " << b.similarityScore << ",\n";
        ss << "      \"isBold\": " << (b.isBold ? "true" : "false") << ",\n";
        ss << "      \"isItalic\": " << (b.isItalic ? "true" : "false") << ",\n";
        ss << "      \"boundingBox\": {\n";
        ss << "        \"ymin\": " << b.boundingBox.ymin << ",\n";
        ss << "        \"xmin\": " << b.boundingBox.xmin << ",\n";
        ss << "        \"ymax\": " << b.boundingBox.ymax << ",\n";
        ss << "        \"xmax\": " << b.boundingBox.xmax << "\n";
        ss << "      }\n";
        ss << "    }" << (i + 1 < blocks.size() ? "," : "") << "\n";
    }

    ss << "  ]\n";
    ss << "}\n";
    return ss.str();
}

std::wstring TextExporter::GenerateTXTString(
    const std::vector<TextBlock>& blocks,
    const TranslationResult& result
) {
    std::wostringstream ss;
    ss << L"GörselÇevir - Windows 10/11 Masaüstü Dökümü\n";
    ss << L"Kaynak Dil: " << result.detectedLanguage << L"\n";
    ss << L"Hedef Dil: " << result.targetLanguage << L"\n";
    ss << L"Metin Sayısı: " << blocks.size() << L"\n";
    ss << L"--------------------------------------------------\n\n";

    int index = 1;
    for (const auto& b : blocks) {
        ss << L"[" << index++ << L"] Font: " << b.matchedSystemFont << L"\n";
        ss << L"Orijinal: " << b.originalText << L"\n";
        ss << L"Türkçe:   " << b.translatedText << L"\n\n";
    }

    return ss.str();
}

std::expected<void, std::string> TextExporter::ExportToFile(
    const std::filesystem::path& path,
    std::string_view content
) {
    std::ofstream file(path, std::ios::binary);
    if (!file) {
        return std::unexpected("Dosya oluşturulamadı: " + path.string());
    }
    file.write(content.data(), content.size());
    if (!file.good()) {
        return std::unexpected("Dosyaya veri yazılırken bir hata oluştu.");
    }
    return {};
}

bool TextExporter::CopyToClipboard(std::wstring_view text) {
    if (!OpenClipboard(nullptr)) return false;

    EmptyClipboard();

    size_t byteSize = (text.size() + 1) * sizeof(wchar_t);
    HGLOBAL hGlobal = GlobalAlloc(GMEM_MOVEABLE, byteSize);
    if (!hGlobal) {
        CloseClipboard();
        return false;
    }

    void* pData = GlobalLock(hGlobal);
    if (!pData) {
        GlobalFree(hGlobal);
        CloseClipboard();
        return false;
    }

    memcpy(pData, text.data(), text.size() * sizeof(wchar_t));
    static_cast<wchar_t*>(pData)[text.size()] = L'\0';
    GlobalUnlock(hGlobal);

    SetClipboardData(CF_UNICODETEXT, hGlobal);
    CloseClipboard();
    return true;
}

} // namespace GorselCevir

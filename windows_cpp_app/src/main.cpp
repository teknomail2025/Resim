#include "Types.hpp"
#include "FontMatcher.hpp"
#include "ImageRenderer.hpp"
#include "TranslatorEngine.hpp"
#include "TextExporter.hpp"

#include <windows.h>
#include <windowsx.h>
#include <commctrl.h>
#include <commdlg.h>
#include <shellapi.h>
#include <dwmapi.h>
#include <memory>
#include <string>
#include <vector>

#pragma comment(lib, "dwmapi.lib")

namespace GorselCevir {

// Application IDs for menus and buttons
enum ControlId : WORD {
    ID_FILE_OPEN = 1001,
    ID_FILE_SAVE = 1002,
    ID_FILE_EXPORT_CSV = 1003,
    ID_FILE_EXPORT_JSON = 1004,
    ID_FILE_EXPORT_TXT = 1005,
    ID_EDIT_COPY_CSV = 1006,
    ID_EDIT_COPY_JSON = 1007,
    ID_ACTION_TRANSLATE = 1008,
    ID_VIEW_HQ_TOGGLE = 1009,
    ID_HELP_ABOUT = 1010
};

class MainWindow {
public:
    MainWindow() = default;
    ~MainWindow() = default;

    MainWindow(const MainWindow&) = delete;
    MainWindow& operator=(const MainWindow&) = delete;

    bool Create(HINSTANCE hInstance, int nCmdShow) {
        m_hInstance = hInstance;

        WNDCLASSEXW wc{};
        wc.cbSize = sizeof(WNDCLASSEXW);
        wc.style = CS_HREDRAW | CS_VREDRAW;
        wc.lpfnWndProc = StaticWndProc;
        wc.hInstance = hInstance;
        wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
        wc.hbrBackground = nullptr; // Handled by Direct2D
        wc.lpszClassName = L"GorselCevirNativeWindow";
        wc.hIcon = LoadIcon(nullptr, IDI_APPLICATION);

        if (!RegisterClassExW(&wc)) return false;

        m_hwnd = CreateWindowExW(
            WS_EX_ACCEPTFILES,
            wc.lpszClassName,
            L"GörselÇevir - Windows 10/11 Yerel Masaüstü Çevirmeni (C++20)",
            WS_OVERLAPPEDWINDOW,
            CW_USEDEFAULT, CW_USEDEFAULT, 1280, 850,
            nullptr, nullptr, hInstance, this
        );

        if (!m_hwnd) return false;

        // Apply Windows 11 Dark Mode Titlebar
        BOOL useDarkMode = TRUE;
        DwmSetWindowAttribute(m_hwnd, 20 /* DWMWA_USE_IMMERSIVE_DARK_MODE */, &useDarkMode, sizeof(useDarkMode));

        CreateMenuBar();
        DragAcceptFiles(m_hwnd, TRUE);

        ShowWindow(m_hwnd, nCmdShow);
        UpdateWindow(m_hwnd);

        return true;
    }

private:
    static LRESULT CALLBACK StaticWndProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
        MainWindow* self = nullptr;
        if (uMsg == WM_NCCREATE) {
            auto* cs = reinterpret_cast<CREATESTRUCTW*>(lParam);
            self = reinterpret_cast<MainWindow*>(cs->lpCreateParams);
            SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(self));
            self->m_hwnd = hwnd;
        } else {
            self = reinterpret_cast<MainWindow*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
        }

        if (self) {
            return self->HandleMessage(uMsg, wParam, lParam);
        }
        return DefWindowProcW(hwnd, uMsg, wParam, lParam);
    }

    LRESULT HandleMessage(UINT uMsg, WPARAM wParam, LPARAM lParam) {
        switch (uMsg) {
            case WM_CREATE: {
                // Initialize subsystems with RAII smart pointers
                ComPtr<IDWriteFactory> dwriteFactory;
                DWriteCreateFactory(
                    DWRITE_FACTORY_TYPE_SHARED,
                    __uuidof(IDWriteFactory),
                    reinterpret_cast<IUnknown**>(dwriteFactory.GetAddressOf())
                );
                m_fontMatcher = std::make_shared<FontMatcher>(dwriteFactory);
                m_renderer = std::make_unique<ImageRenderer>(m_hwnd, m_fontMatcher);
                m_translator = std::make_unique<TranslatorEngine>();

                if (!m_renderer->Initialize()) {
                    MessageBoxW(m_hwnd, L"Direct2D grafik motoru başlatılamadı.", L"Hata", MB_ICONERROR);
                }
                return 0;
            }

            case WM_PAINT: {
                PAINTSTRUCT ps;
                BeginPaint(m_hwnd, &ps);
                if (m_renderer) {
                    m_renderer->Render(m_currentResult.textBlocks, m_viewMode, 0.5f, m_selectedBlock);
                }
                EndPaint(m_hwnd, &ps);
                return 0;
            }

            case WM_SIZE: {
                UINT w = LOWORD(lParam);
                UINT h = HIWORD(lParam);
                if (m_renderer) {
                    m_renderer->OnResize(w, h);
                }
                InvalidateRect(m_hwnd, nullptr, FALSE);
                return 0;
            }

            case WM_DROPFILES: {
                HDROP hDrop = reinterpret_cast<HDROP>(wParam);
                wchar_t filePath[MAX_PATH];
                if (DragQueryFileW(hDrop, 0, filePath, MAX_PATH)) {
                    LoadAndTranslate(filePath);
                }
                DragFinish(hDrop);
                return 0;
            }

            case WM_COMMAND: {
                HandleCommand(LOWORD(wParam));
                return 0;
            }

            case WM_KEYDOWN: {
                bool isCtrl = (GetKeyState(VK_CONTROL) & 0x8000) != 0;
                if (isCtrl && wParam == 'O') {
                    OpenImageFileDialog();
                } else if (isCtrl && wParam == 'S') {
                    SaveImageFileDialog();
                } else if (isCtrl && wParam == 'E') {
                    ExportCSVFileDialog();
                } else if (isCtrl && wParam == 'J') {
                    ExportJSONFileDialog();
                }
                return 0;
            }

            case WM_DESTROY: {
                PostQuitMessage(0);
                return 0;
            }
        }
        return DefWindowProcW(m_hwnd, uMsg, wParam, lParam);
    }

    void CreateMenuBar() {
        HMENU hMenu = CreateMenu();
        HMENU hFileMenu = CreatePopupMenu();
        HMENU hExportMenu = CreatePopupMenu();
        HMENU hHelpMenu = CreatePopupMenu();

        AppendMenuW(hFileMenu, MF_STRING, ID_FILE_OPEN, L"&Görsel Aç...\tCtrl+O");
        AppendMenuW(hFileMenu, MF_STRING, ID_FILE_SAVE, L"&Görseli Kaydet...\tCtrl+S");
        AppendMenuW(hFileMenu, MF_SEPARATOR, 0, nullptr);
        AppendMenuW(hFileMenu, MF_STRING, ID_ACTION_TRANSLATE, L"&Türkçe'ye Çevir");

        AppendMenuW(hExportMenu, MF_STRING, ID_FILE_EXPORT_CSV, L"&CSV Tablosu Olarak İndir (Excel)...\tCtrl+E");
        AppendMenuW(hExportMenu, MF_STRING, ID_FILE_EXPORT_JSON, L"&JSON Verisi Olarak İndir...\tCtrl+J");
        AppendMenuW(hExportMenu, MF_STRING, ID_FILE_EXPORT_TXT, L"&Metin Belgesi (.TXT) İndir...");
        AppendMenuW(hExportMenu, MF_SEPARATOR, 0, nullptr);
        AppendMenuW(hExportMenu, MF_STRING, ID_EDIT_COPY_CSV, L"&CSV Metnini Panoya Kopyala");
        AppendMenuW(hExportMenu, MF_STRING, ID_EDIT_COPY_JSON, L"&JSON Metnini Panoya Kopyala");

        AppendMenuW(hHelpMenu, MF_STRING, ID_VIEW_HQ_TOGGLE, L"&2x Yüksek Kalite Modu (Açık)");
        AppendMenuW(hHelpMenu, MF_SEPARATOR, 0, nullptr);
        AppendMenuW(hHelpMenu, MF_STRING, ID_HELP_ABOUT, L"&Hakkında (Modern C++20 / Direct2D)");

        AppendMenuW(hMenu, MF_POPUP, reinterpret_cast<UINT_PTR>(hFileMenu), L"&Dosya");
        AppendMenuW(hMenu, MF_POPUP, reinterpret_cast<UINT_PTR>(hExportMenu), L"&Dışa Aktar (Belge / Veri)");
        AppendMenuW(hMenu, MF_POPUP, reinterpret_cast<UINT_PTR>(hHelpMenu), L"&Ayarlar");

        SetMenu(m_hwnd, hMenu);
    }

    void HandleCommand(WORD id) {
        switch (id) {
            case ID_FILE_OPEN: OpenImageFileDialog(); break;
            case ID_FILE_SAVE: SaveImageFileDialog(); break;
            case ID_FILE_EXPORT_CSV: ExportCSVFileDialog(); break;
            case ID_FILE_EXPORT_JSON: ExportJSONFileDialog(); break;
            case ID_FILE_EXPORT_TXT: ExportTXTFileDialog(); break;
            case ID_EDIT_COPY_CSV: {
                auto csv = TextExporter::GenerateCSVString(m_currentResult.textBlocks, m_currentResult);
                TextExporter::CopyToClipboard(std::wstring(csv.begin(), csv.end()));
                MessageBoxW(m_hwnd, L"CSV verisi panoya kopyalandı! Excel'e yapıştırabilirsiniz.", L"Bilgi", MB_OK);
                break;
            }
            case ID_EDIT_COPY_JSON: {
                auto json = TextExporter::GenerateJSONString(m_currentResult.textBlocks, m_currentResult);
                TextExporter::CopyToClipboard(std::wstring(json.begin(), json.end()));
                MessageBoxW(m_hwnd, L"JSON verisi panoya kopyalandı!", L"Bilgi", MB_OK);
                break;
            }
            case ID_ACTION_TRANSLATE: {
                if (!m_currentImagePath.empty()) {
                    LoadAndTranslate(m_currentImagePath);
                }
                break;
            }
            case ID_VIEW_HQ_TOGGLE: {
                m_highQuality = !m_highQuality;
                HMENU hMenu = GetMenu(m_hwnd);
                CheckMenuItem(hMenu, ID_VIEW_HQ_TOGGLE, m_highQuality ? MF_CHECKED : MF_UNCHECKED);
                InvalidateRect(m_hwnd, nullptr, FALSE);
                break;
            }
            case ID_HELP_ABOUT: {
                MessageBoxW(
                    m_hwnd,
                    L"GörselÇevir - Windows 10/11 Yerel Masaüstü Uygulaması\n\n"
                    L"• Dil ve Standart: Modern C++20 / C++23\n"
                    L"• Grafik: Donanım Hızlandırmalı Direct2D & DirectWrite\n"
                    L"• Tipografi: Sistem Font Eşleme Motoru\n"
                    L"• Veri: UTF-8 BOM CSV & JSON Dışa Aktarma\n"
                    L"• Çevrimdışı ve Yerel Çalışma Desteği",
                    L"GörselÇevir Hakkında",
                    MB_OK | MB_ICONINFORMATION
                );
                break;
            }
        }
    }

    void OpenImageFileDialog() {
        wchar_t szFile[MAX_PATH] = { 0 };
        OPENFILENAMEW ofn{};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = m_hwnd;
        ofn.lpstrFilter = L"Görsel Dosyaları (*.png;*.jpg;*.jpeg;*.webp;*.bmp)\0*.png;*.jpg;*.jpeg;*.webp;*.bmp\0Tüm Dosyalar (*.*)\0*.*\0";
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = MAX_PATH;
        ofn.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST;

        if (GetOpenFileNameW(&ofn)) {
            LoadAndTranslate(szFile);
        }
    }

    void LoadAndTranslate(const std::wstring& path) {
        m_currentImagePath = path;
        if (!m_renderer->LoadImageFromFile(path)) {
            MessageBoxW(m_hwnd, L"Görsel yüklenemedi.", L"Hata", MB_ICONERROR);
            return;
        }

        // Run translation
        auto translation = m_translator->TranslateImage(path);
        if (translation.has_value()) {
            m_currentResult = std::move(translation.value());
            // Match fonts for all blocks using DirectWrite
            for (auto& block : m_currentResult.textBlocks) {
                block.matchedSystemFont = m_fontMatcher->FindBestMatchingSystemFont(block.fontCategory);
            }
        } else {
            MessageBoxW(m_hwnd, translation.error().c_str(), L"Bilgi", MB_ICONINFORMATION);
        }

        InvalidateRect(m_hwnd, nullptr, FALSE);
    }

    void SaveImageFileDialog() {
        if (!m_renderer || !m_renderer->HasImage()) {
            MessageBoxW(m_hwnd, L"Önce bir görsel açmalısınız.", L"Uyarı", MB_ICONWARNING);
            return;
        }

        wchar_t szFile[MAX_PATH] = L"cevrilmis_gorsel.png";
        OPENFILENAMEW ofn{};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = m_hwnd;
        ofn.lpstrFilter = L"PNG Görseli (*.png)\0*.png\0JPEG Görseli (*.jpg)\0*.jpg\0";
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = MAX_PATH;
        ofn.Flags = OFN_OVERWRITEPROMPT;

        if (GetSaveFileNameW(&ofn)) {
            ExportOptions opts;
            opts.scale = m_highQuality ? 2.0f : 1.0f;
            opts.format = ExportOptions::Format::PNG;
            auto res = m_renderer->ExportRenderedImage(szFile, m_currentResult.textBlocks, opts);
            if (res.has_value()) {
                MessageBoxW(m_hwnd, L"Görsel başarıyla bilgisayarınıza kaydedildi!", L"Başarılı", MB_OK);
            } else {
                MessageBoxW(m_hwnd, res.error().c_str(), L"Hata", MB_ICONERROR);
            }
        }
    }

    void ExportCSVFileDialog() {
        if (m_currentResult.textBlocks.empty()) {
            MessageBoxW(m_hwnd, L"Dışa aktarılacak metin bloku bulunamadı.", L"Uyarı", MB_ICONWARNING);
            return;
        }

        wchar_t szFile[MAX_PATH] = L"ceviriler.csv";
        OPENFILENAMEW ofn{};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = m_hwnd;
        ofn.lpstrFilter = L"CSV Dosyası (*.csv)\0*.csv\0";
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = MAX_PATH;
        ofn.Flags = OFN_OVERWRITEPROMPT;

        if (GetSaveFileNameW(&ofn)) {
            auto csv = TextExporter::GenerateCSVString(m_currentResult.textBlocks, m_currentResult);
            auto res = TextExporter::ExportToFile(szFile, csv);
            if (res.has_value()) {
                MessageBoxW(m_hwnd, L"CSV tablosu başarıyla kaydedildi! Excel veya Google E-Tablolar ile açabilirsiniz.", L"Başarılı", MB_OK);
            }
        }
    }

    void ExportJSONFileDialog() {
        if (m_currentResult.textBlocks.empty()) {
            MessageBoxW(m_hwnd, L"Dışa aktarılacak metin bloku bulunamadı.", L"Uyarı", MB_ICONWARNING);
            return;
        }

        wchar_t szFile[MAX_PATH] = L"ceviriler.json";
        OPENFILENAMEW ofn{};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = m_hwnd;
        ofn.lpstrFilter = L"JSON Verisi (*.json)\0*.json\0";
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = MAX_PATH;
        ofn.Flags = OFN_OVERWRITEPROMPT;

        if (GetSaveFileNameW(&ofn)) {
            auto json = TextExporter::GenerateJSONString(m_currentResult.textBlocks, m_currentResult);
            auto res = TextExporter::ExportToFile(szFile, json);
            if (res.has_value()) {
                MessageBoxW(m_hwnd, L"JSON dosyası başarıyla kaydedildi!", L"Başarılı", MB_OK);
            }
        }
    }

    void ExportTXTFileDialog() {
        wchar_t szFile[MAX_PATH] = L"ceviriler.txt";
        OPENFILENAMEW ofn{};
        ofn.lStructSize = sizeof(ofn);
        ofn.hwndOwner = m_hwnd;
        ofn.lpstrFilter = L"Metin Belgesi (*.txt)\0*.txt\0";
        ofn.lpstrFile = szFile;
        ofn.nMaxFile = MAX_PATH;
        ofn.Flags = OFN_OVERWRITEPROMPT;

        if (GetSaveFileNameW(&ofn)) {
            auto txt = TextExporter::GenerateTXTString(m_currentResult.textBlocks, m_currentResult);
            // Save as UTF-8
            std::string utf8Txt;
            int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, txt.c_str(), -1, nullptr, 0, nullptr, nullptr);
            if (sizeNeeded > 0) {
                utf8Txt.resize(sizeNeeded);
                WideCharToMultiByte(CP_UTF8, 0, txt.c_str(), -1, utf8Txt.data(), sizeNeeded, nullptr, nullptr);
            }
            TextExporter::ExportToFile(szFile, utf8Txt);
            MessageBoxW(m_hwnd, L"Metin belgesi kaydedildi!", L"Başarılı", MB_OK);
        }
    }

    HWND m_hwnd{ nullptr };
    HINSTANCE m_hInstance{ nullptr };

    // Subsystems
    std::shared_ptr<FontMatcher> m_fontMatcher;
    std::unique_ptr<ImageRenderer> m_renderer;
    std::unique_ptr<TranslatorEngine> m_translator;

    // State
    std::wstring m_currentImagePath;
    TranslationResult m_currentResult;
    ViewMode m_viewMode{ ViewMode::PureImage };
    std::optional<size_t> m_selectedBlock;
    bool m_highQuality{ true };
};

} // namespace GorselCevir

// Windows WinMain Entry Point
int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE, PWSTR, int nCmdShow) {
    // Initialize COM for DirectWrite & WIC
    HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
    if (FAILED(hr)) return 1;

    // Initialize Common Controls v6
    INITCOMMONCONTROLSEX icex;
    icex.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icex.dwICC = ICC_WIN95_CLASSES | ICC_STANDARD_CLASSES;
    InitCommonControlsEx(&icex);

    GorselCevir::MainWindow app;
    if (!app.Create(hInstance, nCmdShow)) {
        CoUninitialize();
        return 1;
    }

    // Standard message loop
    MSG msg{};
    while (GetMessageW(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    CoUninitialize();
    return static_cast<int>(msg.wParam);
}

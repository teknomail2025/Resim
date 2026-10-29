# GörselÇevir - Windows 10/11 Yerel Masaüstü Uygulaması (Modern C++20 / C++23)

Tamamen **Modern C++ (C++20/C++23)** standartlarıyla, ham pointer kullanılmadan (RAII & Smart Pointer mimarisi) yazılmış, Windows 10 ve Windows 11 üzerinde donanım hızlandırmalı GPU grafik motoruna sahip yerel masaüstü uygulamasıdır.

---

### Teknik Özellikler ve Mimari
1. **Modern C++ Standartları**:
   - `std::unique_ptr`, `std::shared_ptr`, `Microsoft::WRL::ComPtr` ile %100 RAII bellek yönetimi.
   - Hiçbir ham (raw) pointer ile manuel `new`/`delete` içermez. Bellek sızıntısı riski sıfırdır.
   - Hata yönetimi için C++23 `std::expected` ve `std::optional` kullanılmıştır.
2. **GPU Donanım Hızlandırması & Windows Yerel Grafik**:
   - Webview, Electron, Node veya Chromium içermez; doğrudan Windows'un yerel **Direct2D** ve **DirectWrite** grafik kütüphanelerini kullanır.
   - Başlangıç süresi milisaniyeler seviyesindedir, RAM tüketimi ~25-45 MB bandındadır.
3. **Akıllı Tipografi ve Sistem Font Eşleme (FontMatcher)**:
   - DirectWrite `IDWriteFontCollection` üzerinden kullanıcının bilgisayarındaki fontları tarar.
   - Karikatür, manga balonları, afişler ve tabelalar için en uygun yerel fontları (Comic Sans MS, Segoe Print, Impact, Georgia, Segoe UI vb.) otomatik eşler.
4. **Veri ve Belge Dışa Aktarma (TextExporter)**:
   - **CSV Tablosu**: UTF-8 BOM (`\xEF\xBB\xBF`) ile Microsoft Excel ve Google E-Tablolarda Türkçe karakterleri bozmadan açar.
   - **JSON Formatı**: Koordinatlar, font bilgileri ve çevirileri içeren yapılandırılmış tam veri.
   - **TXT Formatı**: Hızlı döküm.
   - **Windows Panosu**: Tek tıkla CSV ve JSON panoya kopyalama.
5. **Çevrimdışı ve Yerel Çalışma**:
   - İnternet bağlantısı koptuğunda veya yerel PC modunda balon ekleme, düzenleme ve kaydetme özellikleri kesintisiz çalışır.

---

### Bilgisayarda Derleme ve Çalıştırma (1-Tık)

#### Gereksinimler:
- Windows 10 veya Windows 11 (64-bit)
- Visual Studio 2022 ("C++ ile Masaüstü Geliştirme" paketi seçili) veya CMake 3.22+

#### Adımlar:
1. `windows_cpp_app` klasörüne girin.
2. `build_and_run.bat` dosyasına çift tıklayın.
3. CMake projeyi otomatik yapılandıracak, MSVC ile derleyecek ve `GorselCevir.exe` dosyasını başlatacaktır.

#### Visual Studio IDE İle Açmak İçin:
- Visual Studio'yu açıp **Dosya > Aç > CMake...** diyerek `windows_cpp_app/CMakeLists.txt` dosyasını seçin ve `F5` tuşuna basın.

---

### Klavye Kısayolları
- **Ctrl + O**: Bilgisayardan görsel seçip açar (veya görseli pencereye sürükleyip bırakabilirsiniz).
- **Ctrl + S**: Çevrilmiş görseli yüksek kalitede bilgisayara kaydeder.
- **Ctrl + E**: Metin bloklarını CSV (Excel) olarak dışa aktarır.
- **Ctrl + J**: Metin bloklarını JSON olarak dışa aktarır.

@echo off
chcp 65001 > nul
echo ====================================================================
echo   GorselCevir - Windows 10/11 Yerel Modern C++ (C++20) Derleme Araci
echo ====================================================================
echo.

if not exist build mkdir build
cd build

echo [*] CMake yapilandirmasi hazirlaniyor (Visual Studio 2022 / C++20)...
cmake .. -DCMAKE_BUILD_TYPE=Release

if %ERRORLEVEL% NEQ 0 (
    echo [!] CMake yapilandirmasinda hata olustu. Lutfen Visual Studio 2022 C++ yuklu oldugundan emin olun.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [*] Modern C++ native binary derleniyor...
cmake --build . --config Release

if %ERRORLEVEL% NEQ 0 (
    echo [!] Derleme hatasi meydana geldi.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [V] Derleme basariyla tamamlandi! Uygulama baslatiliyor...
echo.

if exist "Release\GorselCevir.exe" (
    start "" "Release\GorselCevir.exe"
) else if exist "GorselCevir.exe" (
    start "" "GorselCevir.exe"
)

exit /b 0

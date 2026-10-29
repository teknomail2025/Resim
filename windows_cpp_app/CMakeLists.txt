cmake_minimum_required(VERSION 3.22)
project(GorselCevirNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enforce strict MSVC standards and UTF-8 encoding
if(MSVC)
    add_compile_options(
        /W4
        /permissive-
        /utf-8
        /Zc:__cplusplus
        /EHsc
    )
    add_compile_definitions(
        UNICODE
        _UNICODE
        WIN32_LEAN_AND_MEAN
        NOMINMAX
        _CRT_SECURE_NO_WARNINGS
    )
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/ImageRenderer.cpp
    src/TranslatorEngine.cpp
    src/FontMatcher.cpp
    src/TextExporter.cpp
)

set(HEADERS
    src/Types.hpp
    src/ImageRenderer.hpp
    src/TranslatorEngine.hpp
    src/FontMatcher.hpp
    src/TextExporter.hpp
)

add_executable(GorselCevir WIN32 ${SOURCES} ${HEADERS})

# Windows Native Libraries (Direct2D, DirectWrite, WIC, WinHTTP, Comctl32, Shell32, Crypt32)
target_link_libraries(GorselCevir PRIVATE
    d2d1
    dwrite
    windowscodecs
    winhttp
    comctl32
    shell32
    ole32
    uuid
    crypt32
    user32
    gdi32
    comdlg32
)

target_include_directories(GorselCevir PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

# Enable High DPI Awareness
if(MSVC)
    set_target_properties(GorselCevir PROPERTIES
        LINK_FLAGS "/MANIFEST:EMBED /MANIFESTINPUT:${CMAKE_CURRENT_SOURCE_DIR}/app.manifest"
    )
endif()

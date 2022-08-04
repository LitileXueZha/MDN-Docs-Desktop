![Screenshot Index](docs/screenshot.png)

# MDN Docs Desktop

Offline MDN docs viewer.

## Install

1. install electron
2. download `app.asar`

I'm too lazy to create application package for different platform, so you need to download Electron's [prebuilt binaries](https://github.com/electron/electron/releases).

Download `app.asar` from latest [releases](https://github.com/LitileXueZha/MDN-Docs-Desktop/releases), then put it into your electron install directory `resources/app`.

**Make sure** your downloaded electron version is matched with the release `app.asar` required version.

Then you can try the optional step, [Customization](#customization).

Happy for using ~~~

## About

MDN web docs 是一个共建的网络学习平台，多年来一直是查询文档标准的好地方，其内容托管在 Github 仓库 [content](https://github.com/mdn/content) 和翻译仓库 [translated-content](https://github.com/mdn/translated-content) 上，主要由 Mozilla 进行托管和维护。

2022/03/01, Mozilla 发布了 [A new year, a new MDN](https://hacks.mozilla.org/2022/03/a-new-year-a-new-mdn/)，一个奇怪的 logo，糟糕体验的交互和排版设计，还有随后将会推出的 Plus 版本 😰😨😱

MDN Docs Desktop 是一个离线的文档浏览器，依赖于内容仓库，对排版和交互进行了优化。


## Customization

```shell
rcedit electron.exe --set-file-version "0.0.1.0"
rcedit electron.exe
    --set-icon favicon.ico
    --set-version-string "CompanyName" "litilexuezha"
    --set-version-string "FileVersion" ""
    --set-version-string "FileDescription" "MDN Docs Desktop"
    --set-version-string "LegalCopyright" "MIT License, Copyright (c) litilexuezha"
    --set-version-string "OriginalFilename" "MDN-Docs-Desktop.exe"
    --set-version-string "ProductName" "MDN Docs Desktop"
    --set-version-string "ProductVersion" ""
mv electron.exe MDN-Docs-Desktop.exe
```

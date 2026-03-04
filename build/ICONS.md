# App Icons for Electron Builds

Place the following icon files in this directory before running `electron-builder`.
electron-builder will pick them up automatically from the path referenced in `package.json`.

| File | Platform | Required Size |
|---|---|---|
| `icon.icns` | macOS | 1024 × 1024 px (ICNS contains multiple sizes) |
| `icon.ico` | Windows | 256 × 256 px (ICO with 16/32/48/256 sizes) |
| `icon.png` | Linux | 512 × 512 px (PNG, square) |

## Generating from a single PNG source

If you have a high-resolution (1024×1024+) PNG:

### macOS `.icns`
```bash
# Using ImageMagick
convert icon.png -resize 1024x1024 icon_1024.png
# Then use iconutil (macOS only) or electron-icon-builder npm package
npx electron-icon-builder --input=icon.png --output=./build
```

### Windows `.ico`
```bash
npx electron-icon-builder --input=icon.png --output=./build
# or: convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

### Quick placeholder (for testing without real icons)
electron-builder will fall back to the default Electron icon if icon files are missing.
You can test the build without icons and add them before final release.

## Notes
- Icons are NOT required for the `next build` step — only for `electron-builder`
- The build will complete without icons; you'll just get the default Electron icon
- For signed macOS builds the icon must be embedded in the app bundle

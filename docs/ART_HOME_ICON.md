# Home-screen icon

The user supplied `docs/art/home-icon-source.png` on September 21, 2026 and explicitly requested it as the web-app home-screen icon. Its composition and artwork are preserved. No replacement artwork was generated.

`node tools/create-icons.mjs` packages that square image at 180 pixels for the Apple touch icon and at 192/512 pixels for the web-app manifest. The operating system applies its own icon mask. New filenames separate this artwork from cached copies of the old geometric icon. The offline build includes all three icon sizes. The supplied source stays outside the installed game package.

The older `tools/create-icons.py` and geometric PNGs remain historical assets and do not define the current icon.

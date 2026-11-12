# MCreator Java to Block Translator

Translate Minecraft Java code into an MCreator-style visual block preview and Blockly XML. The app is useful for examining generated procedures, reconstructing block logic, and preparing templates to review in MCreator. It targets MCreator 2026.1 and offers NeoForge 1.21.1 and 26.1.2 selections.

**Translations are not 100% accurate.** The app uses pattern matching and may choose an incorrect block, omit context, or preserve unsupported code in a custom snippet. Review the blocks, dependencies, trigger, and exported result in MCreator before relying on it. A complete Java class with fields, helper methods, or event listeners cannot necessarily be reconstructed as one procedure.

## Use the app

1. Paste Java source into the input panel and choose the element type and NeoForge version.
2. Select **Convert Code to Blocks**. If multiple methods are found, select the method you want to inspect.
3. Review the visual blocks, XML, element specification, and line mapping. Unsupported fragments may appear as custom code snippets.
4. Copy the Blockly XML or export the selected template format (`.ptpl`, `.aitpl`, `.cmdtpl`, or `.ftpl`). In the visual canvas, use the download icon to save the block view as PNG, JPG, or SVG.
5. Open or import the result in a compatible MCreator workspace and verify the behavior and referenced mod elements.

The visual canvas is a preview of the translation. Image exports are for sharing or reference; use the template or XML for MCreator.

## Run locally on Windows

Install Node.js with npm, then double-click `start.bat`. It starts the local development server and opens **http://localhost:5173**. Missing project dependencies are installed automatically. `stop.bat` stops the instance started by these scripts, and `restart.bat` restarts it. The scripts do not stop unrelated servers; if port 5173 is occupied, stop the other service first.

For manual setup:

```powershell
npm install
npm run dev
```

The manual development server uses the address printed in its terminal. The translator itself runs in the browser; no API key is needed for the normal conversion interface.

## Development and checks

```powershell
npm test
npm run test:corpus
npm run build
```

The regression suite checks known mappings and can also scan procedure digest files. The corpus checks for conversion failures and timeouts; it does not prove that every block is correct. See [tests/README.md](tests/README.md) for digest locations, filters, and limitations. `MCreator_MCreator_digest.txt` is reference material used to compare block definitions and generators.

## License

See [LICENSE](LICENSE).

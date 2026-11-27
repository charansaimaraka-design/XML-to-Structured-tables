<img width="1858" height="924" alt="image" src="https://github.com/user-attachments/assets/25d2a43b-db60-4370-a03a-41b1f8210df4" />
<img width="1506" height="583" alt="image" src="https://github.com/user-attachments/assets/8bb67592-9ed8-4896-89a4-381a550ba456" />

XML TABLE CONVERTER PRO — WINDOWS EDITION
Version 1.8.0

START
1. Extract the ZIP to a normal folder.
2. Double-click Start-Converter.bat.
3. Your default browser opens the local application.
4. Keep the black PowerShell window open while using the app. Close it to stop the local server.

No Node.js, Python, internet connection, CDN, external API, or remote font is required. The local launcher uses Windows PowerShell and binds only to 127.0.0.1.

FEATURES IN THIS BUILD
- Local XML file selection, drag/drop, paste, and sample input.
- Web Worker parsing, streamed file reads, incremental chunk handling, progress, and cancel.
- XML comments, CDATA, processing instructions, quoted attributes, entity decoding, namespaces/prefixes retained in names, self-closing tags.
- Element attributes become @attribute columns; child leaf elements become columns.
- Nested elements with child elements become separate path-based tables. Repeated nested records are retained as rows in their respective table.
- Search, sortable columns, pagination (25/50/100/500), working column visibility (header and data cells), per-column filters, row selection.
- CSV, standalone HTML, and XLSX workbook export. XLSX contains a worksheet for each generated table; cell values are exported as text to preserve identifiers and leading zeros.
- Local-only launcher and offline assets.

IMPORTANT IMPLEMENTATION NOTES / LIMITATIONS
- The parser is a bundled, event-style incremental tokenizer implemented in the Web Worker. It does not use DOMParser and does not resolve external entities. DOCTYPE declarations are skipped; external entity expansion is not performed.
- XML-to-table mapping is intentionally loss-aware for repeated child records, but it is a practical generic mapping rather than a schema-aware relational database designer. Mixed content and deeply irregular structures may need manual interpretation. When a parent has multiple same-name child values, the parent summary row joins those values with " | "; the child records are also emitted in their own table paths.
- The browser must hold converted table rows in memory for sorting/search/export. Streaming input reduces peak input buffering, but output memory still grows with row count. 100 MB is not guaranteed on every PC.
- Light/dark theme toggle; preference is saved in the browser.\n- CSV and HTML exports create the selected table. XLSX exports all detected tables. XML export creates an XML document containing the selected rows and currently visible columns.
- XLSX is generated with a small in-app OOXML/ZIP writer; no third-party library is downloaded or loaded.
- XML encodings: UTF-8 is supported through the browser stream decoder. Other declared encodings are not auto-converted in this build.
- Namespace prefixes are preserved as part of element and attribute names; namespace URI resolution is not performed.
- A malformed XML file stops parsing with a readable error. The parser validates matching tags and unclosed elements but is not a complete W3C XML conformance validator.
- The local launcher requires Windows PowerShell 5.1 or later and an available local port 8766. It does not install a Windows service.
- Security: the server listens on loopback only; XML content is rendered using textContent, not executed. No network requests are made by the application.

TEST STATUS
- Source files and package structure created.
- Syntax and functional smoke tests are pending execution in the target Windows browser.
- Large 20 MB / 50 MB / 100 MB performance tests, Excel interoperability, and offline-disconnect verification have NOT been performed in this environment. Do not treat those acceptance tests as passed.
- Recommended validation: test a small sample, a 10,000-record file, then 20 MB and 50 MB files on the intended Windows PC. Check the XLSX in Microsoft Excel or LibreOffice.

CONTENTS
XML-Table-Converter.html
Start-Converter.bat
Start-Converter.ps1
assets/css/styles.css
assets/js/app.js
workers/xml-worker.js
samples/sample.xml
README.txt
LICENSES.txt

LICENSES
This package uses original application code and browser/Windows platform APIs only. No third-party runtime library is bundled in this initial build.


VERSION 1.2.0 ADDITIONS
- Clear all filters resets global search and every column filter for the active table.
- Selected rows can be copied to clipboard as XML, CSV, or Excel-compatible TSV. Clipboard copy uses the browser Clipboard API with a fallback.
- Selected rows can also be downloaded as XML.
- XML Editor now has a VS Code-inspired dark editor surface, line numbers, Format XML, Validate, and Copy actions. It is a lightweight built-in editor, not the full Visual Studio Code application or Monaco editor.
- Table columns can be resized by dragging the right edge of a header.
- Fit columns to values estimates widths from up to the first 1,500 records.
- Fit table to width distributes visible columns across the table viewport.
- Header identifies DEVELOPER Charan.
- Local server port is 8766.
- Light/dark theme toggle remains available and remembers the choice.

CLIPBOARD NOTE
"Copy selected for Excel" places tab-separated text on the clipboard. Paste it directly into Excel. A browser page cannot generally place a native binary .xlsx workbook directly on the clipboard; use Download XLSX for a real workbook.


VERSION 1.3.0 ADDITIONS
- Removed the separate editor toolbar strip and moved Format XML, Validate and Copy XML beside Load sample and Clear in the Input XML heading.
- Added Show/Hide table grid toggle.
- Improved table header styling, row striping, hover and selected-row appearance, and filter control cards.
- Replaced plain browser alert popups with a branded in-app dialog.
- Added selected JSON clipboard copy and Clear selection controls.
- Added keyboard shortcuts: Ctrl+Enter converts XML; Ctrl+Shift+F formats the XML editor.


VERSION 1.4.0 ADDITIONS
- Added a top-right Shortcuts button with an in-app keyboard shortcut and workflow reference dialog.
- Repositioned all selected-data clipboard actions, including JSON, XML, CSV, and Excel-compatible TSV, into a right-aligned copy-actions group.
- Rebuilt table grid toggle to switch explicit grid-visible / grid-hidden classes and strongly override cell borders so the visual change is clear.
- Redesigned application styling with a SynthWave 84-inspired retro-futuristic neon palette: midnight purple surfaces, neon magenta and cyan accents, glowing controls, gradient primary actions, and a subtle perspective grid background.
- Default appearance is SynthWave dark; light companion theme remains available via the theme toggle.
- Added more distinct hover, active, focus, and disabled button states.
- The UI is inspired by the color language and retro-futuristic direction described on VIN STAR's SynthWave 84 theme page; it does not install or modify the Windows desktop theme.


VERSION 1.5.0 VISUAL UPDATE
- Reworked the application theme to follow the attached Windows 11 desktop reference: dark plum/midnight purple surfaces, translucent layered panels, soft neon violet/pink/cyan highlights, and restrained diagonal synthwave lighting.
- Updated the header into separate status, shortcuts, theme and developer sections.
- Developer credit is now the final right-aligned header item and reads exactly "Developed by CHARAN".
- Added responsive header wrapping for narrower screens to prevent shortcuts and developer credit from overlapping.
- Existing light/dark theme toggle, application features and local port 8766 are retained.


VERSION 1.6.0 — PURPLE & ORANGE DESKTOP THEME
- Recoloured the application using the uploaded Windows desktop screenshot as the visual reference: dark plum/purple backgrounds, muted lavender text, warm orange highlights and warm metallic borders.
- Updated primary actions, hover states, editor, tabs, table headers, filters, dialogs and progress indicators to the purple/orange palette.
- Kept the header content in this order: offline status, Shortcuts, theme toggle, then the rightmost "Developed by CHARAN" credit.
- Reworked desktop header spacing and responsive wrapping to prevent the shortcuts and developer credit from overlapping.
- Port remains 8766.


VERSION 1.7.0 ADDITIONS
- Replaced the previous bright SynthWave neon-grid presentation with a Windows 11 desktop-inspired purple interface based on the user's supplied screenshot: muted plum/purple surfaces, translucent panel treatment, soft purple highlights, compact desktop-style controls and subtle angular wallpaper accents.
- Reworked header layout using a dedicated flex group. Shortcuts and theme controls remain grouped; "Developed by CHARAN" is the final rightmost item. At narrower widths the developer credit moves to its own right-aligned row to prevent overlap.
- Added "All rows" to the table page-size selector so the complete active table can be viewed beyond 500 rows.
- Select-all now works when All rows is active.
- Range label changes to "Showing all N records" when the full table is displayed.


VERSION 1.8.0 ADDITIONS
- Preserves the Windows 11-inspired muted purple/plum theme from v1.7.0. The newly uploaded HTML is a markup file that references assets/css/styles.css; it does not embed its own visual theme, so the v1.7 stylesheet is retained as part of the final package.
- Preserves all v1.7 functionality: XML worker parsing, progress and cancel, nested table output, search, per-column filters, sorting, column visibility, column resizing, fit-to-content, fit-to-width, grid toggle, selection, clipboard copy (JSON/XML/CSV/Excel-compatible TSV), CSV/XLSX/HTML/XML downloads, light/dark theme, shortcut guide, developer credit, local launcher and All rows view.
- Added Select filtered to select every record matching the active global and per-column filters.
- Added Copy filtered JSON and Copy filtered CSV clipboard actions, right-aligned with the existing copy controls.
- Added Filtered CSV download to export only rows matching the active filters.
- Added Ctrl+F to focus table search and Escape to clear the search while the search box is focused.
- Updated shortcut guide to document All rows, filtered selection, filtered copy/export and the new keyboard shortcuts.

CLIPBOARD / EXPORT NOTES
- Excel-compatible clipboard copy uses tab-separated text; paste into Excel.
- XLSX remains a native downloadable workbook containing a worksheet for each detected table.
- Filtered CSV and filtered clipboard actions operate on the active table and current global/per-column filters.
- Selected-row copy/export actions use the selected records in the active table and visible columns.


VERSION 1.9.0 THEME UPDATE
- Recreated the attached screenshot's light appearance: white header and cards, pale lavender-to-ice-blue background, dark plum controls, magenta primary action, and a deep purple XML editor with a muted line-number gutter.
- Added a coordinated dark appearance with deep plum surfaces, readable light text, purple table headers, and matching editor/popup/button styling.
- Light appearance is the default for this release. The selected theme is persisted separately under the v1.9 theme preference key so an older saved v1.8 dark preference does not override the new screenshot-matched default.
- Theme button label indicates the action available: "Dark" while light appearance is active and "Light" while dark appearance is active.
- Theme toggle updates aria-label and aria-pressed for accessibility.
- localStorage failures are handled safely; theme switching still works for the current session if browser storage is unavailable.


VERSION 1.10.0 — BUG FIXES AND HARDENING
- Removed the redundant Copy filtered JSON and Copy filtered CSV buttons. Use Select filtered / row selection followed by the standard Copy selected JSON, XML, CSV, or Excel-compatible controls.
- Rebuilt column resizing to use a stable pointer lifecycle with pointer capture, minimum/maximum widths, pointer-cancel handling, and persistent per-table/per-column width state.
- A resize drag no longer bubbles into the header sort handler. Synthetic click after a drag is explicitly suppressed, so resizing cannot accidentally sort.
- Fit columns to values and Fit table to width now update the same persistent width map used by manual resizing. Widths therefore remain consistent after rerender, filtering, sorting, paging, and switching between tables.
- Table uses max-content width with a 100% minimum width so fixed column widths do not get silently compressed by the table layout.
- Added keyboard-accessible resizing: focus a column resize grip and press Left/Right arrow to adjust width in 10 px increments.
- Updated shortcut guide and resize grip hover/focus feedback.
- Kept filtered CSV download and Select filtered, as these are distinct from the removed clipboard-copy buttons.


VERSION 1.11.0 — COLUMN WIDTH PERSISTENCE FIX
- Reduced the minimum manually resizable column width from 60 px to 35 px. Long column names now truncate with an ellipsis rather than forcing the column to remain as wide as its heading.
- Column headers now render their text in a dedicated .column-title element with overflow hidden and ellipsis. Table cells also clip long values so content does not override a manually chosen width.
- Replaced max-content table sizing with an explicit pixel width calculated from the selection column plus all data-column widths. This prevents browser intrinsic sizing from silently redistributing widths.
- Manual widths are stored by table name and column name, not by visual position, and saved to localStorage. Sorting, filtering, pagination, table repaint, and reload preserve the chosen widths.
- Resize drag updates both the column <col> width and explicit table width immediately.
- Fit-to-content and fit-to-table continue to update the shared width map; manual adjustments after those operations remain persistent.


VERSION 1.11.1 — NARROW COLUMN REFINEMENT
- Reduced header horizontal padding and resize-grip footprint so the 35 px minimum width is reachable in practice, not only in the resize state.
- Applied border-box sizing and zero intrinsic minimum width to header/data cells. Column labels ellipsize; long cell values clip, so the column title/content cannot force a wider layout.
- Column widths remain keyed by original field name and persisted independently of sort order.

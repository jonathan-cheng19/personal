# Personal Projects

## Parametric Tiny House Fabricator

This repository now includes an experimental web studio for automatically generating unique, fabrication-aware tiny house concepts. Open `tiny-house-studio.html` in a modern browser to:

- Configure site, sustainability, and systems criteria.
- Synthesize dozens of distinct layouts with immersive 3D visualization powered by three.js.
- Inspect tabbed reports covering spatial programming, bill of materials, scheduling, and financial projections.
- Evaluate climate risk using live Open-Meteo climate datasets tied to the project location.
- Run a simulated 3D printing sequence and export a captured WebM video.

All computations run client-side; no build step is required.

### Running the studio locally

1. Clone this repository (or download the source) without changing the folder structure. The HTML expects the `scripts/` and `styles/` directories to sit beside `tiny-house-studio.html`.
2. From the repository root (`/path/to/personal`), start a simple static server so the browser can load the ES module script:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit [http://localhost:8000/tiny-house-studio.html](http://localhost:8000/tiny-house-studio.html) in a modern browser and click **Generate Intelligent Layouts**. The progress indicator will confirm that synthesis is running, and new designs will populate the list as soon as they are ready.

Serving from any other directory (or copying files into a new folder) will break the relative paths and result in `404` responses for `scripts/tiny-house.js` and `styles/tiny-house.css`, so make sure to host from the repository root.

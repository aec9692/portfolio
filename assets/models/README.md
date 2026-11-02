# Model assets

4X Lesson 4 is available in the Projects page's interactive viewer.

- `4x-lesson-4.obj`: original exported mesh from Downloads.
- `4X-Lesson-4 (2).mtl`: original companion material.
- `4x-lesson-4.stl`: binary STL converted from the OBJ, containing 5,545 source vertices and 11,086 triangles. The viewer uses a blue material matching the OBJ's diffuse color.

Titan 8M and Titan 9M are also available in the same viewer. Their original OBJ exports are preserved as `titan-8m-coloma.obj` and `titan-9m-coloma.obj`; matching binary STL files are converted from the exported face geometry for the existing STL loader. All three models share the same display material and controls.

The viewer normalizes the part size for display and assumes Z is up. It does not display dimensions or machining toolpaths. Rotate, pan, zoom, reset, and wireframe controls are available.

Serve the repository over HTTP(S), for example with VS Code Live Server. Opening projects.html through file:// does not support the ES modules and model fetches. Three.js, STLLoader, and OrbitControls are vendored locally with their MIT license.
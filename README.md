# tufts-ood-blender-renderer
Open OnDemand app to render animations using Blender on a HPC cluster using GPUs.  The form accepts the path to a Blender file, an output directory, and the HPC resources to use.  Once started, the render job progress can be monitored via the session view in the Open OnDemand Dashboard.

<img width="935" height="871" alt="Blender Render App Screenshot" src="https://github.com/user-attachments/assets/7f139851-882c-459a-8410-9b8d3c8b3228" />

# Features
- Supports Single and Multi node, Multi GPU rendering
- Allows selection of frames to render
- Automatically blocks multiple renderers and cleans up failed frame files
- Supports GPU Model, Parition and QOS selection

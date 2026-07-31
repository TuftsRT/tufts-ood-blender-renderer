# tufts-ood-blender-renderer
Open OnDemand app to render animations using Blender on a HPC cluster using GPUs.  The form accepts the path to a Blender file, an output directory, and the HPC resources to use.  Once started, the render job progress can be monitored via the session view in the Open OnDemand Dashboard.

<img width="935" height="871" alt="Blender Render App Screenshot" src="https://github.com/user-attachments/assets/7f139851-882c-459a-8410-9b8d3c8b3228" />

# Features
- Supports Single and Multi node, Multi GPU rendering
- Allows selection of frames to render
- Automatically blocks multiple renderers and cleans up failed frame files
- Supports GPU Model, Parition and QOS selection
- Detects and warns about Out of Memory (OOM) errors

## Requirements

### Compute Node Software

* Blender 4.0+
* CUDA 11.7+

### Open OnDemand
* Open OnDemand 4.0+
* Slurm

## App Installation 
Please see the [References section](#software-installation) below for instructions on how to install the software that is launched by this App.

### 1. Clone the repository
```bash
# Batch Connect / Passenger apps:
cd /var/www/ood/apps/sys

# Widgets / Dashboards — check OOD docs for the correct path

git clone https://github.com/TuftsRT/tufts-ood-blender-renderer
cd tufts-ood-blender-renderer

# Pin to a release (recommended)
git checkout v1.0.0
```

### 2. Configure for your site

To use this Open OnDemand app you need to have CUDA and Blender available.  This app assumes the use of modules, and includes the names/version for our cluster.  Update these as needed in \template\before.sh.erb and \template\script.sh.erb .  Additionally if CUDA and Blender are installed system wide, and available in your PATH variable, these module lines can be removed.

Note: `module load modtree/deprecated` is propetiary to our cluster, and can be removed.


### 3. Verify

<!-- Batch Connect: -->
No OOD restart is needed (Batch Connect apps are detected automatically). Visit your OOD dashboard and look for **[App Name]** under **Interactive Apps > [Category]**.

## Contributing

Contributions are welcome. To contribute:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Submit a pull request with a description of your changes

For bugs or feature requests, [open an issue](https://github.com/TuftsRT/tufts-ood-blender-renderer/issues).

This app is part of the [OOD Appverse](https://ondemand.connectci.org/affinity-groups/ood-appverse). Join the [Appverse Affinity Group](https://ondemand.connectci.org/affinity-groups/ood-appverse) to connect with other contributors.

## License

[MIT License](LICENSE)
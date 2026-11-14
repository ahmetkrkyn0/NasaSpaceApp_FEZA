# shipmodel: Athena (IM-2) lander model

Experimental 3D model of Intuitive Machines' Nova-C lander "Athena" (IM-2, March 2025), built in Blender 5.2.

## Source and credit

The base geometry and textures come from the Celestia add-on
"Intuitive Machines (Nova-C)" by **DaveBowman2001** and **EarthMoon**
(<https://celestia.mobi/resources/item/85562E75-599C-45FB-AA91-8D28E47C9137>).
The license of that add-on has not been confirmed yet; check it before using the model publicly.
The original files (`source/`) are not committed.

## Pipeline

1. Download the add-on zip into `source/` and extract it to `source/addon/`.
2. `python tools/cmod_to_obj.py "source/addon/Project Artemis/Nova-C/models/nova-c.cmod" converted/nova-c.obj "source/addon/Project Artemis/Nova-C/textures/medres"`
3. `blender --background --factory-startup --python tools/import_preview.py -- converted/nova-c.obj renders`
4. `blender --background --factory-startup --python tools/enhance.py -- renders/nova-c_imported.blend "source/addon/Project Artemis/Nova-C/textures/medres" renders 192`
5. `blender --background --factory-startup --python tools/remodel.py -- renders/athena.blend renders 192`
6. `blender --background --factory-startup --python tools/export_clean.py -- renders/athena_hq.blend export/athena_lander.blend export/athena_lander.glb`

`remodel.py` rebuilds the low-poly parts: thin struts become round tubes with end collars, the two tanks become
smooth ellipsoids with displaced MLI folds, the engine gets a lathed bell nozzle, the footpads become domed pads,
and flat plates get thickness. It renders studio shots (`renders/studio_*.png`) and saves `renders/athena_hq.blend`.

`enhance.py` replaces the materials with PBR versions (crinkled gold/silver MLI, coated solar cells, brushed metal struts),
adds bevels and smooth-by-angle shading, and builds a south-pole style scene (low sun, regolith, rocks, Earth) rendered with Cycles.

## Outputs (lander only, for dropping into another scene)

- `export/athena_lander.blend`: only the lander, in a collection named `Athena`; textures packed.
  Use *File > Append > athena_lander.blend > Collection > Athena*.
- `export/athena_lander.glb`: the same lander as glTF (procedural MLI crinkle is not carried into glTF).

Both files: real size in metres (3.90 x 3.90 x 4.30 m), Z up in the .blend.
The origin (`NovaC` empty) is the centre between the footpads, on their underside, so placing it on the ground puts the lander on its feet.

Working files: `renders/athena_hq.blend` (lander plus studio lights) and `renders/*.png`.

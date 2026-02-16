import bpy
scene = bpy.context.scene
frame_count = scene.frame_end - scene.frame_start + 1
print(f"Total frames: {frame_count}")
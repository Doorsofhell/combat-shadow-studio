import bpy, sys
r = bpy.ops.extensions.package_install_files(filepath=sys.argv[1], repo='user_default', enable_on_install=True)
print("INSTALL", r)
bpy.ops.wm.save_userpref()
import addon_utils
print([m.__name__ for m in addon_utils.modules() if 'mpfb' in m.__name__])

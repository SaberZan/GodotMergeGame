import { Control, EditorPlugin, PackedScene, ResourceLoader } from "godot";
import { createClassBinder } from "godot.annotations";

var bind = createClassBinder();

@bind()
@bind.tool()
export default class EasyConfigEditorPlugin extends EditorPlugin {
	private dock: Control | null = null;

	_enter_tree(): void {
		console.log("EasyConfigEditor plugin loaded");
		let scene = ResourceLoader.load("res://addons/EasyConfigEditor/easy_config_editor.tscn") as PackedScene;
		this.dock = scene.instantiate() as Control;
		this.add_control_to_bottom_panel(this.dock, "Easy Config Editor");
	}

	_exit_tree(): void {
		console.log("EasyConfigEditor plugin unloaded");
		if (this.dock != null) {
			this.remove_control_from_bottom_panel(this.dock);
			this.dock.queue_free();
			this.dock = null;
		}
	}
}

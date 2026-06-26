import { Callable, Control, EditorInterface, EditorPlugin, Vector2i, Window } from "godot";
import { createClassBinder } from "godot.annotations";
import MergeEditorPanel from "./merge_editor";

var bind = createClassBinder();

@bind()
@bind.tool()
export default class MergeEditorPlugin extends EditorPlugin {
    private static readonly MenuName: string = "Merge Editor";
    private static readonly WindowSize: Vector2i = new Vector2i(1180, 760);
    private static readonly WindowMinSize: Vector2i = new Vector2i(960, 620);

    private window: Window | null = null;
    private panel: Control | null = null;

    _enter_tree(): void {
        console.log("MergeEditor plugin loaded");
        this.add_tool_menu_item(MergeEditorPlugin.MenuName, Callable.create(this, "_onOpenMergeEditor") as any);
    }

    _exit_tree(): void {
        console.log("MergeEditor plugin unloaded");
        this.remove_tool_menu_item(MergeEditorPlugin.MenuName);

        if (this.window != null) {
            this.window.queue_free();
            this.window = null;
            this.panel = null;
        }
    }

    private _onOpenMergeEditor(): void {
        if (this.window == null) {
            this._createWindow();
        }

        if (this.window == null) {
            return;
        }

        this.window.popup_centered(MergeEditorPlugin.WindowSize);
        this.window.move_to_foreground();
    }

    private _createWindow(): void {
        const baseControl = EditorInterface.get_base_control();
        if (baseControl == null) {
            console.error("MergeEditor failed to find editor base control");
            return;
        }

        this.window = new Window();
        this.window.title = MergeEditorPlugin.MenuName;
        this.window.min_size = MergeEditorPlugin.WindowMinSize;
        this.window.size = MergeEditorPlugin.WindowSize;
        this.window.transient = true;
        this.window.exclusive = false;
        this.window.close_requested.connect(Callable.create(this, "_onWindowCloseRequested") as any);
        baseControl.add_child(this.window);

        this.panel = new MergeEditorPanel();
        this.panel.set_anchors_and_offsets_preset(Control.LayoutPreset.PRESET_FULL_RECT);
        this.window.add_child(this.panel);
    }

    private _onWindowCloseRequested(): void {
        this.window?.hide();
    }
}

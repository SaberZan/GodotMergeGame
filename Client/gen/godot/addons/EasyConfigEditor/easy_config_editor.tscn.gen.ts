import EasyConfigEditor from "../../../../addons/EasyConfigEditor/easy_config_editor";
declare module "godot" {
    interface ResourceTypes {
        "res://addons/EasyConfigEditor/easy_config_editor.tscn": PackedScene<EasyConfigEditor>;
    }
}

import main_panel from "../../../../addons/AssetEditor/main_panel";
declare module "godot" {
    interface ResourceTypes {
        "res://addons/AssetEditor/main_panel.tscn": PackedScene<main_panel>;
    }
}

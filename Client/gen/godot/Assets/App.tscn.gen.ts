import App from "../../../src/App";
declare module "godot" {
    interface ResourceTypes {
        "res://Assets/App.tscn": PackedScene<App>;
    }
}

import { BaseUI } from "./BaseUI";
import { LayerType } from "./UIMgr";
import { CanvasItem } from "godot";

export class BaseUILayer extends BaseUI {
    public uIReferenceCount: number = 0;

    public Show() {
        this.uIReferenceCount += 1;
        if (this.uIReferenceCount >= 1 && this.node) {
            (this.node as CanvasItem).visible = true;
            this.node.set_process(true);
            this.node.set_physics_process(true);
        }
    }

    public Hide() {
        this.uIReferenceCount -= 1;
        if (this.uIReferenceCount <= 0 && this.node) {
            (this.node as CanvasItem).visible = false;
            this.node.set_process(false);
            this.node.set_physics_process(false);
        }
    }

    public GetLayerType(): LayerType {
        return LayerType.NORMAL_DYNAMIC;
    }

    public GetLayerName(): string {
        return "";
    }
}

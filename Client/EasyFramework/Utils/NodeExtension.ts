import { Node } from "godot";

declare module "godot" {
    interface Node<Map extends NodePathMap = any> {
        setparent(parent: Node, keep_global_transform?: boolean): void;
    }
}

Node.prototype.setparent = function(parent: Node, keep_global_transform: boolean = true): void {
    if (this.get_parent() != null) {
        this.reparent(parent, keep_global_transform);
        return;
    }

    parent.add_child(this);
};

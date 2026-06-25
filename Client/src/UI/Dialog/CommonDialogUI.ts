import { Button, Callable, Control, Label } from "godot";
import { BaseDialogUI } from "./BaseDialogUI";

export class CommonDialogUI extends BaseDialogUI {
    public static readonly PrefabPath = "res://Assets/UI/CommonDialog.tscn";

    private titleLabel: Label | null = null;
    private contentLabel: Label | null = null;
    private confirmButton: Button | null = null;
    private cancelButton: Button | null = null;
    private started: boolean = false;

    public override OnStart() {
        if (this.started) {
            return;
        }
        if (this.node == null) {
            return;
        }
        this.started = true;

        this.titleLabel = this.node.get_node("Panel/Content/TitleLabel") as Label;
        this.contentLabel = this.node.get_node("Panel/Content/ContentLabel") as Label;
        this.cancelButton = this.node.get_node("Panel/Content/ButtonBox/CancelButton") as Button;
        this.confirmButton = this.node.get_node("Panel/Content/ButtonBox/ConfirmButton") as Button;

        this.titleLabel.text = this.dataInterface?.GetField<string>("title") ?? "提示";
        this.contentLabel.text = this.dataInterface?.GetField<string>("content") ?? "这是一个通用弹窗。";
        this.confirmButton.text = this.dataInterface?.GetField<string>("confirmText") ?? "确定";
        this.cancelButton.text = this.dataInterface?.GetField<string>("cancelText") ?? "取消";

        this.confirmButton.pressed.connect(Callable.create(() => this.OnConfirmPressed()));
        this.cancelButton.pressed.connect(Callable.create(() => this.OnCancelPressed()));
    }

    public override OnEnable() {
        if (this.node != null) {
            (this.node as unknown as Control).visible = true;
        }
    }

    public override OnDisable() {
        if (this.node != null) {
            (this.node as unknown as Control).visible = false;
        }
    }

    private OnConfirmPressed() {
        this.dataInterface?.GetField<() => void>("onConfirm")?.();
        this.Close();
    }

    private OnCancelPressed() {
        this.dataInterface?.GetField<() => void>("onCancel")?.();
        this.Close();
    }
}

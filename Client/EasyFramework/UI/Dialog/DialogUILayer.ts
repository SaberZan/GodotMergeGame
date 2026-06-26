import { LayerType, UIMgr } from "../UIMgr";
import { BaseDialogUI } from "./BaseDialogUI";
import { BaseUILayer } from "../BaseUILayer";
import { Callable, Color, ColorRect, Control, InputEventMouseButton } from "godot";
import { UIData } from "../BaseUI";

export class DialogUILayer extends BaseUILayer {
    public dialogCaches: { [key: string]: BaseDialogUI } = {};

    public dialogs: BaseDialogUI[] = [];

    public get nowDialog(): BaseDialogUI | undefined {
        if (this.dialogs.length > 0) {
            return this.dialogs[this.dialogs.length - 1];
        }
        return undefined;
    };

    /// <summary>
    /// 创建节点 初始化
    /// </summary>
    public override OnCreate() {
        super.OnCreate();
        let node = new Control("DialogUILayer");
        UIMgr.Instance().AddFullScreenRectTransform(node);
        this.SetNode(node);
    }


    /// <summary>
    /// 显示弹窗
    /// </summary>
    /// <param name="dialogUIName">弹窗名称</param>
    /// <param name="prefabPath">预制路径</param>
    public ShowDialogByParams(dialogUIName: string, ctor: new () => BaseDialogUI, prefabPath: string, loadAsync: boolean = false, uiData: UIData | undefined = undefined) {

        let obj = new ctor();
        obj.SetUIName(dialogUIName);
        obj.SetResPath(prefabPath, loadAsync);
        if (uiData)
            obj.SetUIDataInterface(uiData);
        this.ShowDialog(obj);
    }


    /// <summary>
    /// 显示弹窗
    /// </summary>
    /// <param name="dialog">弹窗实例</param>
    public ShowDialog(dialogUI: BaseDialogUI) {
        this.HideDialogInterval(this.nowDialog);
        this.ShowDialogInterval(dialogUI);
    }


    /// <summary>
    /// 展示弹窗
    /// </summary>
    /// <param name="prbDialog"></param>
    private ShowDialogInterval(dialog: BaseDialogUI) {
        let index = this.dialogs.indexOf(dialog);
        if (index != -1) {
            let mask = dialog.baseNode?.get_parent() as Control | undefined;
            if (mask != undefined) {
                mask.visible = true;
            }
            dialog.Show();
            return;
        }
        this.dialogs.push(dialog);
        dialog.Awake();
        let isShowBlack = dialog.IsShowBlack();
        let isClickClose = dialog.IsBlackClickClose();
        let blackMask: ColorRect = new ColorRect();
        blackMask.set_name("DialogMask");
        blackMask.color = new Color(0, 0, 0, 0.55);
        blackMask.mouse_filter = Control.MouseFilter.MOUSE_FILTER_STOP;
        blackMask.set_anchor_and_offset(0, 0, 0);
        blackMask.set_anchor_and_offset(1, 1, 0);
        blackMask.set_anchor_and_offset(2, 1, 0);
        blackMask.set_anchor_and_offset(3, 0, 0);
        blackMask.set_process(false);
        blackMask.set_physics_process(false);
        blackMask.visible = isShowBlack;
        if (isShowBlack) {
            blackMask.set_process(true);
            blackMask.set_physics_process(true);
        }
        if (isClickClose) {
            blackMask.set_process(true);
            blackMask.set_physics_process(true);
            blackMask.gui_input.connect(Callable.create((event: unknown) => {
                if (event instanceof InputEventMouseButton && event.pressed) {
                    this.nowDialog?.Close();
                }
            }));
        }
        UIMgr.Instance().AddFullScreenRectTransform(blackMask);
        //blackMask.GetComponent<RectTransform>().offsetMax = new Vector2(0.0f, 200);
        //���ӵ���
        if (dialog.node) {
            dialog.baseNode?.setparent(blackMask, false);
            if (this.node)
                blackMask.setparent(this.node, false);
            UIMgr.Instance().AddFullScreenRectTransform(dialog.node);
        }
        dialog.Show();
    }

    /// <summary>
    /// 隐藏弹窗内部接口
    /// </summary>
    /// <param name="dialog">弹窗实例</param>
    /// <param name="callback">回调函数</param>
    private HideDialogInterval(dialog: BaseDialogUI | undefined) {
        if (dialog == undefined) {
            return;
        }
        dialog.Hide();
        (dialog.baseNode?.get_parent() as Control).visible = false;
    }

    /// <summary>
    /// 移除弹窗没有hide
    /// </summary>
    private CloseDialogInterval(dialog: BaseDialogUI) {
        var index = this.dialogs.indexOf(dialog);
        if (index != -1) {
            this.dialogs.splice(index, 1);
        }
        var backMask = dialog.baseNode?.get_parent();
        dialog.Destroy();
        backMask?.queue_free();
    }

    /// <summary>
    /// 安卓返回键
    /// </summary>
    public OnDialogBackPressed() {
        if (this.nowDialog != null) {
            this.nowDialog.OnBackPressed();
        }
    }

    /// <summary>
    /// 关闭全部弹窗
    /// </summary>
    public CloseAllDialog() {
        for (var i in this.dialogs) {
            this.dialogs[i].Close();
        }
        this.dialogs = [];
    }

    /// <summary>
    /// 关闭弹窗
    /// </summary>
    /// <param name="dialog"></param>
    public CloseDialog(dialog: BaseDialogUI) {
        this.CloseDialogByName(dialog.GetUIName());
    }

    /// <summary>
    /// 关闭弹窗通过名字
    /// </summary>
    /// <param name="dialog"></param>
    public CloseDialogByName(dialogUIName: string) {

        for (let i = 0, count = this.dialogs.length; i < count; ++i) {
            if (this.dialogs[i].GetUIName() == dialogUIName) {
                if (this.nowDialog == this.dialogs[i]) {
                    this.HideDialogInterval(this.nowDialog);
                    this.CloseDialogInterval(this.nowDialog);
                    if (this.nowDialog != undefined) {
                        this.ShowDialogInterval(this.nowDialog);
                    }
                }
                else {
                    this.CloseDialogInterval(this.dialogs[i]);
                }
                break;
            }
        }
    }

    public Destroy() {
        this.CloseAllDialog();
        super.Destroy();
    }

    public GetLayerType(): LayerType {
        return LayerType.DIALOG;
    }
}

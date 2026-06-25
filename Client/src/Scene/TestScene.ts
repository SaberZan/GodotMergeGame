import { UIData } from "../UI/BaseUI";
import { CommonDialogUI, DialogUILayer } from "../UI/Dialog";
import { UIMgr } from "../UI/UIMgr";
import { BaseScene } from "./BaseScene";


export class TestScene extends BaseScene {

    public Start(): any {
        console.log("TestScene============ start")

        let dialogLayer = UIMgr.Instance().GetLayer<DialogUILayer>(DialogUILayer.name);
        if (dialogLayer == undefined) {
            dialogLayer = new DialogUILayer();
            UIMgr.Instance().AddLayer(dialogLayer);
        }

        let dialogData = UIData.Get();
        dialogData.SetField("title", "通用弹窗");
        dialogData.SetField("content", "这里是弹窗说明内容，可以用于提示、确认操作或展示简短信息。");
        dialogData.SetField("confirmText", "确定");
        dialogData.SetField("cancelText", "取消");
        dialogData.SetField("onConfirm", () => {
            console.log("CommonDialog confirm");
        });
        dialogData.SetField("onCancel", () => {
            console.log("CommonDialog cancel");
        });

        dialogLayer.ShowDialogByParams(CommonDialogUI.name, CommonDialogUI, CommonDialogUI.PrefabPath, false, dialogData);
    }

    public Update(detalTime: number): any {
        
    }
}

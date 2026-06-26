import { UIData } from "../EasyFramework/UI/BaseUI";
import { CommonDialogUI, DialogUILayer } from "../EasyFramework/UI/Dialog";
import { UIMgr } from "../EasyFramework/UI/UIMgr";
import { BaseScene } from "../EasyFramework/Scene/BaseScene";
import { ConfigMgr } from "../EasyFramework/Config/ConfigMgr";
import * as Config from "./Cfg/Index";


export class TestScene extends BaseScene {

    public Start(): any {
        ConfigMgr.Instance().Register(Config);
    }

    public Update(detalTime: number): any {
        
    }
}

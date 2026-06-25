import { MessageMgr } from "../Message/MessageMgr";
import { BaseModule } from "./BaseModule";

export class GameModules {

    private modules: { [key: string]: BaseModule } = {};

    public Register(module: BaseModule) {
        this.modules[module.GetName()] = module;
    }

    public UnRegister(module: BaseModule | string) {
        if (module instanceof BaseModule) {
            delete this.modules[module.GetName()];
        } else {
            delete this.modules[module];
        }
    }

    public Start() {
        for (let key in this.modules) {
            this.modules[key].Start();
        }
    }

    public Update(detailTime: number) {
        for (let key in this.modules) {
            this.modules[key].Update(detailTime);
        }
    }

    public Destory() {
        for (let key in this.modules) {
            this.modules[key].Destory();
        }
        this.modules = {};
    }

}
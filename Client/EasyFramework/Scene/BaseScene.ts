import { MessageMgr } from "../Message/MessageMgr";


export abstract class BaseScene {

    public abstract Start(): any;

    public abstract Update(detalTime: number): any;

    public Destroy() {
        MessageMgr.Instance().OffByTarget(this);
    }
}

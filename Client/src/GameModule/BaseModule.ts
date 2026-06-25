import { MessageMgr } from "../Message/MessageMgr";

export abstract class BaseModule {

    public abstract GetName(): string;

    public abstract Start(): void;

    public abstract Update(detailTime: number): void;

    public Destory() {
        MessageMgr.Instance().OffByTarget(this);
    }
}
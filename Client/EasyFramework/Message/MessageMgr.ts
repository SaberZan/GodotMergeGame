import EventBus from "../Extra/EventBus/EventBus";
import { Singleton } from "../Utils/Singleton";

export class MessageMgr extends Singleton<MessageMgr> {
    private eventBus: EventBus = new EventBus();

    public On(type: string, target: any, callback: Function) {
        this.eventBus.On(type, target, callback);
    }

    public Off(type: string, target: any, callback: Function) {
        this.eventBus.Off(type, target, callback);
    }

    public OffByKey(type: string) {
        this.eventBus.OffByKey(type);
    }

    public OffByTarget(target: any) {
        this.eventBus.OffByTarget(target);
    }

    public Emit(type: string, ...args: any[]) {
        this.eventBus.Emit(type, ...args);
    }

    public Clear() {
        this.eventBus.Clear();
    }
}
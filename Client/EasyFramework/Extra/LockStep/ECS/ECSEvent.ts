/**
 * created by SaberZan
 * 帧同步事件
 */

class ECSEventObj {
    target: object;

    callback: Function;

    constructor(target : object, callback : Function) {
        this.target = target;
        this.callback = callback;
    }
}

export class ECSEvent {
    private maps: { [key: string]: Array<ECSEventObj> } = {};

    public Register(type: string, target: any, callback: Function) {
        if (this.maps[type] == null)
            this.maps[type] = new Array();

        this.maps[type].push({ target: target, callback: callback });
    }

    public Remove(type: string, target: any, callback: Function) {
        if (this.maps[type]) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == target) {
                    this.maps[type].splice(i, 1);
                    --i;
                }
            }
        }
    }

    public ClearByKey(type: string) {
        if (this.maps[type] != null) {
            delete this.maps[type];
        }
    }

    public Emit(type: string, ...args: any[]) {
        if (this.maps[type] != null) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                this.maps[type][i].callback.call(this.maps[type][i].target, ...args);
            }
        }
    }

    public Clear() {
        this.maps = {};
    }
}

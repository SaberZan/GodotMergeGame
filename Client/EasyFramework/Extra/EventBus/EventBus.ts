export default class EventBus
{
    private maps: { [key: string]: { target: object; callback: Function;}[]} = {};

    public On(type: string, target: any, callback: Function) {
        if (this.maps[type] == null)
            this.maps[type] = new Array();

        this.maps[type].push({ target: target, callback: callback });
    }

    public Off(type: string, target: any, callback: Function) {
        if (this.maps[type] != null) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == target && this.maps[type][i].callback == callback) {
                    this.maps[type].splice(i, 1);
                    --i;
                }
            }
        }
    }

    public OffByKey(type: string) {
        if (this.maps[type] != null) {
            delete this.maps[type];
        }
    }

    public OffByTarget(target: any) {
        for(let type in this.maps){
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == target) {
                    this.maps[type].splice(i, 1);
                    --i;
                }
            }
        }
    }

    public Emit(type: string, ...args: any[]) {
        if (this.maps[type] != null) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == null || this.maps[type][i].target == undefined) {
                    this.maps[type][i].callback(...args);
                } else {
                    this.maps[type][i].callback.call(this.maps[type][i].target, ...args);
                }

            }
        }
    }

    public Clear() {
        this.maps = {};
    }
}
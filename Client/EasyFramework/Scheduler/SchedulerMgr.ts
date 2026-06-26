import { Singleton } from "../Utils/Singleton";

export class SchedulerObj {
    target: object | undefined;
    tickTime: number = 0;
    loop: number = 1;
    loopInterval: number = 0;
    args: any[] = [];
    callback: Function | undefined;
}

export class SchedulerMgr extends Singleton<SchedulerMgr> {

    private maps: SchedulerObj[] = [];

    public RegisterObj(ShedulerObj: SchedulerObj) {
        this.maps.push(ShedulerObj);
    }

    /// <summary>
    /// 注册定时器
    /// </summary>
    /// <param name="target"></param>
    /// <param name="schedulerCallBack"></param>
    /// <param name="args"></param>
    /// <param name="priority"></param>
    /// <param name="tickTime"></param>
    /// <param name="loop"></param>
    /// <param name="loopInterval"></param>
    /// <returns></returns>
    public Register(target: any, schedulerCallBack: Function, args: any[], priority: number = 1, tickTime: number = 0, loop: number = 0, loopInterval: number = 1) {
        let timerObj = new SchedulerObj();
        timerObj.target = target;
        timerObj.callback = schedulerCallBack;
        timerObj.args = args;
        timerObj.tickTime = tickTime;
        timerObj.loop = loop;
        timerObj.loopInterval = loopInterval;
        this.RegisterObj(timerObj);
        return timerObj;
    }

    public Remove(ShedulerObj: SchedulerObj) {
        for (let i = this.maps.length - 1; i >= 0; --i) {
            if (this.maps[i] == ShedulerObj) {
                delete this.maps[i].callback;
                this.maps[i].loop = 0;
            }
        }
    }

    public ClearByObj(target: any) {
        for (let i = this.maps.length - 1; i >= 0; --i) {
            if (this.maps[i].target == target) {
                this.maps.splice(i, 1);
            }
        }
    }

    public Update(detalTime: number) {
        let now = Date.now();
        for (let i = 0; i < this.maps.length; ++i) {
            if (this.maps[i].tickTime <= now) {
                if (this.maps[i].callback != null) {
                    if (this.maps[i].target == null || this.maps[i].target == undefined) {
                        this.maps[i].callback?.call(this.maps[i].args);
                    } else {
                        this.maps[i].callback?.call(this.maps[i].target, this.maps[i].args);
                    }
                }

                if (this.maps[i].loop == 0) {
                    this.maps.splice(i, 1);
                    --i;
                } else if (this.maps[i].loop > 0) {
                    --this.maps[i].loop;
                    this.maps[i].tickTime += this.maps[i].loopInterval;
                } else {
                    this.maps[i].tickTime += this.maps[i].loopInterval;
                }
            }
        }
    }

    public Clear() {
        this.maps = [];
    }

}
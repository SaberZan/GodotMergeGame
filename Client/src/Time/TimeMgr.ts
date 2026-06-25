import { Singleton } from "../Utils/Singleton";

export class TimeMgr extends Singleton<TimeMgr> {

    private initTime: number = Date.now();

    private startTime: number = Date.now();

    public async Init(initTime: number): Promise<boolean> {
        if (initTime != undefined)
            this.initTime = initTime;
        return true;
    }

    public Now(): number {
        return this.initTime + Date.now() - this.startTime;
    }

}
/**
 * created by SaberZan
 * 有限状子状态基类
 */

import { FMSMachine } from "./FMSMachine";

export class StateBase {
    //给每个状态设置一个id
    public id: number;

    public stateName: string;

    //被当前机器所控制
    public fmsMachine: FMSMachine | undefined;

    public constructor(id: number, stateName: string) {
        this.id = id;
        this.stateName = stateName;
    }

    //给子类提供方法
    public OnEnter(...args: any[]) {
        //Debug.Log(this.stateName + " Enter");
    }

    public OnStay(...args: any) {
        // Debug.Log(this.StateName + " Stay");
    }

    public OnExit(...args: any) {
        //Debug.Log(this.StateName + " Exit");
    }

}

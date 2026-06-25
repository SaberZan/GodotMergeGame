/**
 * created by SaberZan
 * 有限状子状态模板类
 */

import { StateBase } from "./StateBase";

export class StateTemplate<T> extends StateBase {

    //拥有者(范型)
    public owner: T;

    public constructor(id: number, stateName: string, o: T) {
        super(id, stateName)
        this.owner = o;
    }

}
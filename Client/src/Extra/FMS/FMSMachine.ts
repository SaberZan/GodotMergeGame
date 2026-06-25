/**
 * created by SaberZan
 * 有限状态机
 */

import { StateBase } from "./StateBase";

export class FMSMachine {

    public stateCache: { [key: number]: StateBase };

    public prviousState: StateBase | undefined;

    public currentState: StateBase | undefined;

    //机器初始化
    public constructor(beginState: StateBase) {
        this.prviousState = undefined;
        this.currentState = beginState;

        this.stateCache = {};
        //把状态添加到集合中
        this.AddState(beginState);
        this.currentState.OnEnter();
    }

    //添加状态机状态
    public AddState(state: StateBase) {
        if (this.stateCache[state.id] == null || this.stateCache[state.id] == undefined) {
            this.stateCache[state.id] = state;
            state.fmsMachine = this;
        }
    }

    //通过Id来切换状态
    public TranslateState(id: number) {
        if (this.stateCache[id] == null || this.stateCache[id] == undefined) {
            return;
        }

        this.prviousState = this.currentState;
        if (this.prviousState != null)
            this.prviousState.OnExit();
        this.currentState = this.stateCache[id];
        this.currentState.OnEnter();
    }

    //获取当前状态ID
    public GetCurrentStateID(): number | undefined {
        if(this.currentState)
            return this.currentState.id;
    }

    //获取当前状态名字
    public GetCurrentStateName(): string | undefined {
        if(this.currentState)
            return this.currentState.stateName;
    }

    //获取前一个状态ID
    public GetPrviousStateID(): number | undefined {
        if(this.prviousState)
            return this.prviousState.id;
    }

    //获取前一个状态名字
    public GetPrviousStateName(): string | undefined{
        if(this.prviousState)
            return this.prviousState.stateName;
    }

    //状态保持
    public Update() {
        if (this.currentState != null) {
            this.currentState.OnStay();
        }
    }
}
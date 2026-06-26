import { Button, Input, InputEvent, InputEventKey, InputEventMouseButton, InputEventMouseMotion, InputEventScreenDrag, InputEventScreenTouch, Key, MouseButton, OS, Time, Vector2, Vector3, Viewport, float64 } from "godot";
import { Singleton } from "../Utils/Singleton";

export enum InputModel {
    Down,
    Moving,
    Up,
    Click,
    Scaling,
    Escape
}

export class InputMgr extends Singleton<InputMgr> {

    private maps: { [key: number]: { target: object; callback: Function; }[] } = {};

    private downPos: Vector2 = Vector2.ZERO;

    private curDownPos: Vector2 = Vector2.ZERO;

    private ClickDis: number = 4;

    private DownTime: number = 0.4;

    private downTime: number = 0;

    private curDownTime: number = 0;

    private curTouchesDis: number | undefined;

    private touchPos: { [key: string]: Vector2 } = {}

    public async Init(): Promise<boolean> {
        return true;
    }

    public Input(event: InputEvent) {
        if (event as InputEventMouseButton) {
            let inputEventMouseButton = event as InputEventMouseButton
            if (inputEventMouseButton.button_index == MouseButton.MOUSE_BUTTON_LEFT) {
                if (inputEventMouseButton.is_pressed()) {
                    this.OnTouchDown(inputEventMouseButton.button_index, inputEventMouseButton.global_position);
                } else if (inputEventMouseButton.is_released()) {
                    this.OnTouchUp(inputEventMouseButton.button_index, inputEventMouseButton.global_position);
                }
            }
        } else if (event as InputEventMouseMotion) {
            let inputEventMouseMotion = event as InputEventMouseMotion;
            this.OnTouchMove(-1, inputEventMouseMotion.global_position);
        } else if (event as InputEventScreenTouch) {
            let inputEventScreenTouch = (event as InputEventScreenTouch)
            if (inputEventScreenTouch.is_pressed()) {
                this.touchPos[inputEventScreenTouch.index] = inputEventScreenTouch.position;
                this.OnTouchDown(inputEventScreenTouch.index, inputEventScreenTouch.position);
            } else if (inputEventScreenTouch.is_released()) {
                delete this.touchPos[inputEventScreenTouch.index];
                this.OnTouchUp(inputEventScreenTouch.index, inputEventScreenTouch.position);
            }
        } else if (event as InputEventScreenDrag) {
            let inputEventScreenDrag = event as InputEventScreenDrag;
            this.touchPos[inputEventScreenDrag.index] = inputEventScreenDrag.position;
            this.OnTouchMove(inputEventScreenDrag.index, inputEventScreenDrag.position);
        }


        if (event as InputEventMouseButton) {
            let inputEventMouseButton = (event as InputEventMouseButton)
            if (inputEventMouseButton.is_pressed() && inputEventMouseButton.button_index == MouseButton.MOUSE_BUTTON_MIDDLE) {
                this.Emit(InputModel.Scaling, inputEventMouseButton.factor);
            }
        }

        let keys = Object.keys(this.touchPos)
        if (keys.length == 2) {
            let key1 = keys[0];
            let key2 = keys[1];
            let nowDis = this.touchPos[key1].distance_to(this.touchPos[key2]);
            if (this.curTouchesDis) {
                let scaleDis = 0;
                if (nowDis > this.curTouchesDis) {
                    scaleDis = 0.16;
                } else if (nowDis < this.curTouchesDis) {
                    scaleDis = -0.16;
                } else {
                    scaleDis = 0;
                }
                this.Emit(InputModel.Scaling, scaleDis);
            }
            this.curTouchesDis = nowDis;
        } else {
            this.curTouchesDis = undefined;
        }

        if (event as InputEventKey) {
            let inputEventKey = (event as InputEventKey)
            if (inputEventKey.is_pressed() && inputEventKey.keycode == Key.KEY_ESCAPE) {
                this.Emit(InputModel.Escape);
            }
        }
    }

    private OnTouchMove(index: number, pos: Vector2) {
        let nowPos: Vector2 = pos;
        this.Emit(InputModel.Moving, index, this.curDownPos, nowPos);
        this.curDownPos = nowPos;
    }

    private OnTouchUp(index: number, pos: Vector2) {
        // 左键弹起
        this.curDownTime = Time.get_ticks_msec();
        let interval = this.curDownTime - this.downTime;
        let dis = this.downPos.distance_to(pos);
        if (dis < this.ClickDis && interval < this.DownTime)
            this.Emit(InputModel.Click, index, pos);
        this.Emit(InputModel.Up, index, pos)
    }


    private OnTouchDown(index: number, pos: Vector2) {
        this.curDownPos = this.downPos = pos;
        this.curDownTime = this.downTime = Time.get_ticks_msec();
        this.Emit(InputModel.Down, index, this.downPos);
    }

    public On(type: InputModel, target: any, callback: Function) {
        if (this.maps[type] == null)
            this.maps[type] = [];
        this.maps[type].push({ target: target, callback: callback });
    }

    public Off(type: InputModel, target: any, callback: Function) {
        if (this.maps[type] != null) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == target && this.maps[type][i].callback == callback) {
                    this.maps[type].splice(i, 1);
                    --i;
                }
            }
        }
    }

    public OffByKey(type: InputModel) {
        if (this.maps[type] != null) {
            delete this.maps[type];
        }
    }

    public OffByTarget(target: any) {
        for (let type in this.maps) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == target) {
                    this.maps[type].splice(i, 1);
                    --i;
                }
            }
        }
    }

    public Emit(type: InputModel, ...args: any[]) {
        if (this.maps[type] != null) {
            for (let i = 0; i < this.maps[type].length; ++i) {
                if (this.maps[type][i].target == null || this.maps[type][i].target == undefined) {
                    this.maps[type][i].callback(...args);
                }
                else {
                    this.maps[type][i].callback.call(this.maps[type][i].target, ...args);
                }
            }
        }
    }
}
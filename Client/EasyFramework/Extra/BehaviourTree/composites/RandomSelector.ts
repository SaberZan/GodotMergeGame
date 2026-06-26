///<reference path="./Selector.ts"/>

import { Random } from "../Random";
import { Selector } from "./Selector";

/**
 * 与选择器相同，但它会在启动时无序处理子项
 */
export class RandomSelector<T> extends Selector<T> {
    public onStart() {

        let n = this._children.length - 1;
        while (n > 1) {
            n--;
            let k = Random.range(0, n + 1);
            let value = this._children[k];
            this._children[k] = this._children[n];
            this._children[n] = value;
        }
    }
}

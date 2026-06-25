import { Random } from "../Random";
import { Sequence } from "./Sequence";

/**
 * 与sequence相同，只是它在开始时对子级进行无序处理
 */
export class RandomSequence<T> extends Sequence<T> {
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

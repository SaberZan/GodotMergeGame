/**
 * created by SaberZan
 * 伪随机数
 */

export class PseudoRandom {
    
    private seed: number = 0;

    private lastResult: number = 0;

    constructor(seed: number) {
        this.seed = seed;
    }

    public random(min: number, max: number): number {
        min = min || 0;
        max = max || 99999999;

        this.seed = ((this.seed * 9301 + 49297) % 233280);
        var rnd = this.seed / 233280.0;

        this.lastResult = min + rnd * (max - min);
        return this.lastResult;
    }


    public random_0_1(): number {
        return this.random(0, 1)
    }

    public random_0_100(): number {
        return this.random(0, 100)
    }

    public getLastResult(): number {
        return this.lastResult;
    }

}

export class MapPoint {
    public x: number;

    public y: number;

    public str: string;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.str = this.x + '_' + this.y;
    }

    public Equals(other: MapPoint): boolean {
        return this.x == other.x && this.y == other.y;
    }

    public ToString(): string {
        return this.str;
    }
}

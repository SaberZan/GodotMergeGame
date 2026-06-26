

export class Singleton<T> {

    private static instance: any = null;

    public constructor() {

    }

    public static Instance<T>(this: new () => T): T {
        if ((<any>this).instance == null) {
            (<any>this).instance = new this();
        }

        return (<any>this).instance;
    }

    public async Init(...args: any[]): Promise<boolean> {
        return true;
    }

}
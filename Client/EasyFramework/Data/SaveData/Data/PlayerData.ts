import { SaveData } from "./SaveData";

export class PlayerData extends SaveData {

    public constructor() {
        super();
    }

    public playId: string = "";

    public level: number = 0;

    public Item: { [key: number]: number } = {};
}
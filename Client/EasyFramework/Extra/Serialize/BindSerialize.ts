import { Serialize } from "./Serialize";

export function BindSerialize(serializeName: string) {
    return function <T extends new (...args: any[]) => any>(constructor: T) {
        let serializeClass = class extends constructor {
            serializeName = serializeName;
        };
        Serialize.Instance().Set(serializeName, serializeClass);
        return serializeClass;
    };
}
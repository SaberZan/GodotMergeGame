import { Singleton } from "../Utils/Singleton";
import { Proxy } from "./Proxy";
import * as Services from "./Index";

export class ProxyMgr extends Singleton<ProxyMgr> {

    private services: { [key: string]: Proxy } = {}

    public async Init(): Promise<boolean> {
        Object.keys(Services).map(serviceKey => {
            const element = Services[serviceKey as keyof typeof Services]
            this.services[serviceKey] = new element();
        });
        return true;
    }

    public Get<T extends Proxy>(name: string): T {
        return <T>this.services[name];
    }
}
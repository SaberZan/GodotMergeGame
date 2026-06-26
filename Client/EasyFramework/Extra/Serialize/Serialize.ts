

export class Serialize {

    private static instance: any = null;

    private maps: {[key:string]:new (...args: any[]) => any} = {}

    public static Instance(): Serialize {
        if (this.instance == null) {
            this.instance = new Serialize();
        }
        return this.instance;
    }

    public Get(serializeName: string){
        return this.maps[serializeName];
    }

    public Set(serializeName: string, serializeClass: new (...args: any[]) => any ){
        this.maps[serializeName] = serializeClass;
    }

    public SerializeObject(from: object, target: object) {  
        if(from == null || from == undefined || target == null || target == undefined)
            throw new Error("from or target can not undefined");
        for(var i in from) {
            let fromValue : any = from[i as keyof typeof from];
            let targetValue : any = target[i as keyof typeof target];
            if(typeof(fromValue) == 'object' && typeof(fromValue) !== null){
                if(targetValue == undefined){
                    if(fromValue["serializeName"] != undefined){
                        let serializeClass = this.Get(fromValue["serializeName"]);
                        targetValue = new (serializeClass)();  
                    }else {
                        targetValue = fromValue instanceof Array? []: {};
                    }
                }  
                this.SerializeObject(fromValue, targetValue)
            }else{
                targetValue = fromValue;
            }
        } 
    }
} 
/**
 * created by SaberZan
 * 帧同步ECS实例对象
 */


import { World } from "./World";
import { EntityComponent } from "./EntityComponent"
import { ECSEventName } from "./ECSEventName";


export enum EntityState {
    Alive,
    Destory,
}

export class Entity {
    
    public world: World;

    public id: number;

    public entityState: EntityState = EntityState.Alive;

    public components: { [key: string]: EntityComponent } = {};

    public constructor(world: World, id: number) {
        this.world = world;
        this.id = id;
        this.world.ecsEvent.Emit(ECSEventName.ENTITY_CREATE, this);
    }

    public Start() {
        this.world.ecsEvent.Emit(ECSEventName.ENTITY_START, this);
    }

    public Destory() {
        this.RemoveAllComponent();
        this.world.ecsEvent.Emit(ECSEventName.ENTITY_DESTROY, this);
    }

    /**
     * 获取组件
     * @param key 
     * @returns 
     */
    public GetComponent<T extends EntityComponent>(key: string) {
        return <T>this.components[key];
    }

    /// <summary>
    /// 是否包含这个名字的组件
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    public HasComponent(key: string): boolean {
        return this.components[key] != null && this.components[key] != undefined;
    }

    /// <summary>
    /// 是否包含这个名字的组件
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    public HasComponents(keys: string[]): boolean {
        for(let key in keys) {
            if(this.components[key] == null || this.components[key] == undefined){
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// 添加组件
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public AddComponent<T extends EntityComponent>(c: { new(): T}, ...objs: any[]): T {
        let component: T = new c();
        if (objs.length > 0)
            component.Init(objs);
        component.entity = this;
        this.components[c.name] = component;
        this.world.ecsEvent.Emit(ECSEventName.ENTITY_COMPONENT_ADD, this, c.name, component);
        return component;
    }

    /// <summary>
    /// 添加组件
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public AddComponentByKey(key: string, component: EntityComponent, ...objs: any[]) {
        component.Init(objs);
        component.entity = this;
        this.components[key] = component;
        this.world.ecsEvent.Emit(ECSEventName.ENTITY_COMPONENT_ADD, this, key, component);
        return component;
    }

    /// <summary>
    /// 删除组件
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public RemoveComponent<T extends EntityComponent>(key: string) {
        if (this.components[key] != null || this.components[key] != undefined) {
            let component = this.components[key];
            delete this.components[key];
            this.world.ecsEvent.Emit(ECSEventName.ENTITY_COMPONENT_REMOVE, this, key, component);

        }
    }

    /// <summary>
    /// 删除所有组件
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public RemoveAllComponent() {
        for (const key in this.components) {
            let component = this.components[key];
            delete this.components[key];
            this.world.ecsEvent.Emit(ECSEventName.ENTITY_COMPONENT_REMOVE, this, key, component);
        }
    }

    /// <summary>
    /// 实例的排序, 越小越靠前
    /// </summary>
    /// <returns></returns>
    public GetPriority(): number {
        return this.id;
    }
}

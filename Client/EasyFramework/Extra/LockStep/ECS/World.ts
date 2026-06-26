/**
 * created by SaberZan
 * 帧同步ECS世界
 */


import { ECSEvent } from "./ECSEvent";
import { Entity, EntityState } from "./Entity";
import { EntityComponent } from "./EntityComponent";
import { EntitySystem } from "./EntitySystem";
import { ExecuteSystem } from "./ExecuteSystem";
import { Group } from "./Group";
import { InitSystem } from "./InitSystem";
import { Matcher } from "./Matcher";

export class World {
   
    public ecsEvent: ECSEvent = new ECSEvent();

    public entities: Entity[] = [];

    private groups: Group[] = [];

    public initSystems: InitSystem[] = [];

    public executeSystem: ExecuteSystem[] = [];

    private entitiyIndex: number = 0;

    private matcherIndex: number = 0;

    public tickSystemNum: number = 0;

    private randomCallBack : Function | undefined;

    public constructor() {

    }

    public Clear() {
        this.groups = [];
        this.entities = [];
        this.initSystems = [];
        this.executeSystem = [];
        this.ecsEvent.Clear();
    }

    public InitSystem() {
        for (let i = 0; i < this.initSystems.length; ++i) {
            this.initSystems[i].Init();
        }
        for (let i = 0; i < this.executeSystem.length; ++i) {
            this.executeSystem[i].Init();
        }
    }

    public TickSystem(cmd: any) {
        ++this.tickSystemNum;
        for (let i = 0; i < this.executeSystem.length; ++i) {
            this.executeSystem[i].Tick(cmd);
        }
    }

    public CreateMatcher(all?: string[], any?: string[], no?: string[]): Matcher {
        let matcher = new Matcher(this.matcherIndex++, all || [], any || [], no || []);
        return matcher;
    }

    public CreateEntity(): Entity {
        let entity: Entity = new Entity(this, this.entitiyIndex++);
        entity.entityState = EntityState.Alive;
        this.entities.push(entity);
        return entity;
    }

    public RemoveEntity(entity: Entity) {
        entity.entityState = EntityState.Destory;
        let index = this.entities.indexOf(entity);
        this.entities.splice(index, 1);
    }

    public AddSystem(system: EntitySystem, priority: number) {
        system.priority = priority;
        if(system instanceof InitSystem) {
            this.initSystems.push(system);
            this.initSystems.sort((a, b) => {
                return a.priority < b.priority ? -1 : 1;
            });
        } else if(system instanceof ExecuteSystem) {
            this.executeSystem.push(system);
            this.executeSystem.sort((a, b) => {
                return a.priority < b.priority ? -1 : 1;
            });
        }
    }

    public GetComponents<T extends EntityComponent>(key: string): T[] {
        let components: T[] = [];
        for (let i = 0; i < this.entities.length; ++i) {
            if (this.entities[i].entityState == EntityState.Alive) {
                let component: T = this.entities[i].GetComponent<T>(key);
                if (component != null) {
                    components.push(component);
                }
            }
        }
        return components;
    }

    public GetEntities(matcher: Matcher): Entity[] {
        for (let i = 0; i < this.groups.length; ++i) {
            if(this.groups[i].matcher.IsSameMatcher(matcher)) {
                return this.groups[i].GetEntities();
            }
        }

        let newGroup: Group = new Group(this, matcher);
        this.groups.push(newGroup);
        for (let i = 0; i < this.entities.length; ++i) {
            newGroup.MatchEntity(this.entities[i]);
        }
        
        return newGroup.GetEntities();
    }

    public GetRandom(start: number, end : number): number {
        if(this.randomCallBack != null) {
            return this.randomCallBack(start, end);
        }
        return Math.random() * (end - start) + start;
    }

    public GetRandomInt(start: number, end : number): number {
        return Math.floor(this.GetRandom(start, end));
    }

    public SetRandomCallback(callback: Function) {
        this.randomCallBack = callback;
    }

}

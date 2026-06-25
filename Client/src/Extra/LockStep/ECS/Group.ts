/**
 * created by SaberZan
 * 帧同步ECS实例组
 */

import { ECSEventName } from "./ECSEventName";
import { Entity } from "./Entity";
import { Matcher } from "./Matcher";
import { World } from "./World";

export class Group {

    public matcher: Matcher;

    public entities: Entity[] = [];

    public entitiesCanche: Entity[] | undefined = undefined;

    public constructor(world: World, matcher: Matcher) {
        this.matcher = matcher;
        world.ecsEvent.Register(ECSEventName.ENTITY_CREATE, this, this.MatchEntity);
        world.ecsEvent.Register(ECSEventName.ENTITY_DESTROY, this, this.RemoveEntity);
        world.ecsEvent.Register(ECSEventName.ENTITY_COMPONENT_ADD, this, this.MatchEntity);
        world.ecsEvent.Register(ECSEventName.ENTITY_COMPONENT_REMOVE, this, this.MatchEntity);
    }

    public MatchEntity(entity: Entity) {
        let index = this.entities.indexOf(entity);
        let isMatch = this.IsMatch(entity);
        if (index == -1 && isMatch) {
            this.entities.push(entity);
            this.entitiesCanche = undefined;
        } else if (index != -1 && !isMatch) {
            this.entities.splice(index, 1)
            this.entitiesCanche = undefined;
        }
    }

    public RemoveEntity(entity: Entity) {
        let index = this.entities.indexOf(entity);
        if (index != -1) {
            this.entities.splice(index, 1);
            this.entitiesCanche = undefined;
        }
    }

    public GetEntities(): Entity[] {
        if (this.entitiesCanche != undefined) {
            return this.entitiesCanche;
        }
        this.entitiesCanche = []
        this.entitiesCanche = this.entitiesCanche.concat(this.entities);        
        return this.entitiesCanche;
    }

    public IsMatch(entity: Entity): boolean {
        return this.matcher.IsMatch(entity);
    }

}

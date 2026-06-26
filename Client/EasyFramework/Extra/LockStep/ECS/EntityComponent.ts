/**
 * created by SaberZan
 * 帧同步ECS实例组件
 */

import { Entity } from "./Entity";

export class EntityComponent {
    public entity: Entity | undefined;

    public Init(...args: any[]) {

    }


    public SnapShot(): string {
        return "";
    }
}

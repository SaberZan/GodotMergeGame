import { Entity } from "./Entity";

export class Matcher {

    public matcherId: number;

    public allKeys: string[] = [];

    public anyKeys: string[] = [];

    public noKeys: string[] = [];

    constructor(matcherId: number, allKeys?: string[], anyKeys?: string[], noKeys?: string[]) {
        this.matcherId = matcherId;
        this.allKeys = allKeys || [];
        this.anyKeys = anyKeys || [];
        this.noKeys = noKeys || [];
    }

    public IsMatch(entity: Entity): boolean {
        for (let i = 0; i < this.allKeys.length; ++i) {
            if (!entity.HasComponent(this.allKeys[i])) {
                return false;
            }
        }

        let hasOne = this.anyKeys.length == 0;
        if (!hasOne) {
            for (let i = 0; i < this.anyKeys.length; ++i) {
                if (entity.HasComponent(this.anyKeys[i])) {
                    hasOne = true
                    break;
                }
            }
            if (!hasOne) {
                return false;
            }
        }

        for (let i = 0; i < this.noKeys.length; ++i) {
            if (entity.HasComponent(this.noKeys[i])) {
                return false;
            }
        }
        return true;
    }

    public IsSameMatcher(matcher: Matcher): boolean {

        if (this.matcherId == matcher.matcherId) {
            return true;
        }

        if (this.allKeys.length != matcher.allKeys.length) {
            return false;
        }

        if (this.anyKeys.length != matcher.anyKeys.length) {
            return false;
        }

        if (this.noKeys.length != matcher.noKeys.length) {
            return false;
        }

        for (let i = 0; i < matcher.allKeys.length; ++i) {
            if (!this.allKeys.includes(matcher.allKeys[i])) {
                return false;
            }
        }

        for (let i = 0; i < matcher.anyKeys.length; ++i) {
            if (!this.anyKeys.includes(matcher.anyKeys[i])) {
                return false;
            }
        }

        for (let i = 0; i < matcher.noKeys.length; ++i) {
            if (!this.noKeys.includes(matcher.noKeys[i])) {
                return false;
            }
        }

        return true;
    }
}
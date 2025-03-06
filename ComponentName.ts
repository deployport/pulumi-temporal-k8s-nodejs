/**
 * Name of a component
 */
export class ComponentName {
    readonly name: string;
    constructor(name: string) {
        this.name = name;
    }

    subcomponent(name: string) {
        return new ComponentName(`${this.name}-${name}`);
    }

    toString() {
        return this.name;
    }
}
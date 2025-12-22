export interface Component {
    readonly _type: string;
}
export type ComponentConstructor<T extends Component> = new (...args: any[]) => T;

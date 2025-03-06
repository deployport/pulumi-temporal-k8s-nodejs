import { Configuration } from "./Configuration";
import { ComponentName } from "./ComponentName";
import { ServerDynamicConfigMap } from "./ServerDynamicConfig";
import { ResourceOptions } from "./ResourceOptions";
import { ServerConfigTemplateMap } from "./ServerConfigTemplateMap";
import { ServerInitConfigMap } from "./ServerInitConfigMap";
import { ServerDeployment } from "./ServerDeployment";
import { ServerService } from "./ServerService";
import { UIDeployment } from "./UIDeployment";
import { UIService } from "./UIService";
import { ServerJob } from "./ServerJob";

export type StackArgs = {
    config: Configuration,
};

export class Stack {
    private name: ComponentName;
    private config: Configuration;
    public readonly serverConfigMap: ServerConfigTemplateMap;
    public readonly dynamicConfigMap: ServerDynamicConfigMap;
    public readonly serverInitConfigMap: ServerInitConfigMap;
    public readonly serverDeployment: ServerDeployment;
    public readonly serverService: ServerService;
    public readonly uiDeployment: UIDeployment;
    public readonly uiService: UIService;
    public readonly serverJob: ServerJob;

    constructor({ config }: StackArgs, opts?: ResourceOptions) {
        config.validate();
        this.name = config.name
        this.config = config;
        this.serverConfigMap = new ServerConfigTemplateMap(this.name, config, opts);
        this.dynamicConfigMap = new ServerDynamicConfigMap(this.name, opts);
        this.serverInitConfigMap = new ServerInitConfigMap(config, opts);
        this.serverDeployment = new ServerDeployment({
            config: this.config,
            dynamicConfig: this.dynamicConfigMap,
            serverConfigTemplate: this.serverConfigMap,
            initConfig: this.serverInitConfigMap,
        }, opts);
        this.serverService = new ServerService({
            config: this.config.frontend,
            deployment: this.serverDeployment,
        }, opts);
        this.serverJob = new ServerJob({
            config: this.config,
            serverService: this.serverService,
            initConfig: this.serverInitConfigMap,
        }, opts);
        this.uiDeployment = new UIDeployment({
            parent: this.name,
            config: this.config,
            serverService: this.serverService,
        }, opts);
        this.uiService = new UIService({
            parent: this.name,
            deployment: this.uiDeployment,
        }, opts);
    }
}
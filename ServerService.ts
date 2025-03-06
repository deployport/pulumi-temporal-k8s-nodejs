import * as k8s from "@pulumi/kubernetes";
import { ComponentName } from "./ComponentName";
import { FrontendConfig } from "./Configuration";
import { ResourceOptions } from './ResourceOptions';
import { ServerDeployment } from "./ServerDeployment";
import { Output } from "@pulumi/pulumi";
import { DependsOn } from "./DependsOn";

export type ServerServiceArgs = {
    config: FrontendConfig
    deployment: ServerDeployment
}

export class ServerService {
    public readonly service: k8s.core.v1.Service;
    private readonly componentName: ComponentName;
    public readonly port: number;
    public readonly configChecksum: Output<string>;
    public readonly dependsOn: DependsOn;

    get name() {
        return this.componentName.name;
    }

    constructor({ config, deployment }: ServerServiceArgs, opts?: ResourceOptions) {
        this.componentName = config.serviceName;
        this.port = config.servicePort;
        const name = this.name;
        this.configChecksum = deployment.configChecksum;
        this.dependsOn = [deployment.deployment];
        this.service = new k8s.core.v1.Service(name, {
            metadata: {
                name: name,
                namespace: opts?.namespace,
            },
            spec: {
                ports: [
                    {
                        port: this.port,
                        targetPort: "grpc",
                        protocol: "TCP",
                        name: "grpc",
                    },
                ],
                selector: deployment.matchLabels,
            },
        }, {
            ...opts,
            dependsOn: this.dependsOn,
        });
    }
}
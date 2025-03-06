import * as k8s from "@pulumi/kubernetes";
import { ComponentName } from "./ComponentName";
import { ResourceOptions } from './ResourceOptions';
import { UIDeployment } from "./UIDeployment";

export type UIServiceArgs = {
    parent: ComponentName
    deployment: UIDeployment
}

export class UIService {
    public readonly service: k8s.core.v1.Service;
    private readonly componentName: ComponentName;

    get name() {
        return this.componentName.name;
    }

    constructor({ parent, deployment }: UIServiceArgs, opts?: ResourceOptions) {
        this.componentName = parent.subcomponent("ui");
        const name = this.name;
        this.service = new k8s.core.v1.Service(name, {
            metadata: {
                name: name,
                namespace: opts?.namespace,
            },
            spec: {
                ports: [
                    {
                        port: 80,
                        targetPort: "http",
                        protocol: "TCP",
                        name: "http",
                    },
                ],
                selector: deployment.matchLabels,
            },
        }, {
            ...opts,
            dependsOn: [
                deployment.deployment,
            ],
        });
    }
}
import * as k8s from "@pulumi/kubernetes";

import { ComponentName } from "./ComponentName";
import { Configuration } from "./Configuration";
import { ResourceOptions } from './ResourceOptions';
import { ServerService } from "./ServerService";
import { MatchLabels } from "./MatchLabels";

export type UIDeploymentArgs = {
    parent: ComponentName
    config: Configuration
    serverService: ServerService
}

export class UIDeployment {
    public readonly deployment: k8s.apps.v1.Deployment;
    public readonly matchLabels: MatchLabels;

    constructor({ parent, config, serverService }: UIDeploymentArgs, opts?: ResourceOptions) {
        const deploymentName = parent.subcomponent("ui");
        const name = deploymentName.name;
        this.matchLabels = {
            app: name,
        };

        const temporalEnv: k8s.types.input.core.v1.EnvVar[] = [
            {
                name: "TEMPORAL_ADDRESS",
                value: `${serverService.name}:${serverService.port}`,
            },
            {
                name: "TEMPORAL_CORS_ORIGINS",
                value: config.ui.corsOrigins.join(","),
            },
            {
                name: "TEMPORAL_CSRF_COOKIE_INSECURE",
                value: config.ui.csrfCookieInsecure.toString(),
            },
            {
                name: "TEMPORAL_UI_PORT",
                value: config.ui.port.toString(),
            }
        ];

        this.deployment = new k8s.apps.v1.Deployment(name, {
            metadata: {
                name: name,
                namespace: opts?.namespace,
                labels: {
                    app: name,
                },
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: this.matchLabels,
                },
                template: {
                    metadata: {
                        labels: this.matchLabels,
                        // annotations: config.PodAnnotations,
                    },
                    spec: {
                        containers: [{
                            name: "ui",
                            image: `temporalio/ui:${config.ui.version}`,
                            imagePullPolicy: 'IfNotPresent',
                            ports: [{
                                name: "http",
                                containerPort: config.ui.port,
                                protocol: "TCP",
                            }],
                            livenessProbe: {
                                initialDelaySeconds: 10,
                                tcpSocket: {
                                    port: "http",
                                },
                            },
                            readinessProbe: {
                                initialDelaySeconds: 10,
                                tcpSocket: {
                                    port: "http",
                                },
                            },
                            env: temporalEnv,
                            // resources: config.Resources,
                            // securityContext: config.SecurityContext,
                        }],
                        // imagePullSecrets: config.ImagePullSecrets,
                        // securityContext: config.PodSecurityContext,
                        enableServiceLinks: false,
                        // nodeSelector: config.NodeSelector,
                        // affinity: config.Affinity,
                        // tolerations: config.Tolerations,
                    },
                },
            },
        }, {
            ...opts,
        });
    }
}

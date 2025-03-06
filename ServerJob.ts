import * as k8s from "@pulumi/kubernetes";
import { Configuration } from "./Configuration";
import { ResourceOptions } from './ResourceOptions';
import { ServerInitConfigMap } from "./ServerInitConfigMap";
import { MatchLabels } from "./MatchLabels";
import { ServerService } from "./ServerService";

export type ServerJobArgs = {
    config: Configuration
    serverService: ServerService
    initConfig: ServerInitConfigMap
}

export class ServerJob {
    public readonly job: k8s.batch.v1.Job;
    public readonly matchLabels: MatchLabels;

    constructor({ config, serverService, initConfig }: ServerJobArgs, opts?: ResourceOptions) {
        const jobName = config.name.subcomponent("server-job");
        const name = jobName.name;
        this.matchLabels = {
            app: name,
        };

        const dependsOnConfigMapsChecksum = serverService.configChecksum;

        const adminToolsVersion = config.adminToolsVersion;
        const temporalEnv: k8s.types.input.core.v1.EnvVar[] = [
            {
                name: "TEMPORAL_CONFIG_CHECKSUM",
                value: dependsOnConfigMapsChecksum,
            },
        ];

        this.job = new k8s.batch.v1.Job(name, {
            metadata: {
                name: name,
                namespace: opts?.namespace,
            },
            spec: {
                backoffLimit: 60,
                completions: 1,
                template: {
                    spec: {
                        restartPolicy: "OnFailure",
                        containers: [{
                            name: "default-ns",
                            image: `temporalio/admin-tools:${adminToolsVersion}`,
                            command: ["/temporal-init/create-default-ns.sh"],
                            env: temporalEnv,
                            volumeMounts: [{
                                name: "init-script",
                                mountPath: "/temporal-init/",
                                readOnly: true,
                            }],
                        }],
                        volumes: [{
                            name: "init-script",
                            configMap: {
                                name: initConfig.name,
                                defaultMode: 0o777,
                            },
                        }],
                    },
                },
            },
        }, {
            ...opts,
            dependsOn: [
                ...serverService.dependsOn,
                serverService.service,
            ],
        });
    }
}

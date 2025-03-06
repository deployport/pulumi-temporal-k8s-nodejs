import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { Configuration } from "./Configuration";
import { ResourceOptions } from './ResourceOptions';
import { ServerDynamicConfigMap } from "./ServerDynamicConfig";
import { ServerConfigTemplateMap } from "./ServerConfigTemplateMap";
import { ServerInitConfigMap } from "./ServerInitConfigMap";
import { MatchLabels } from "./MatchLabels";
import { DependencyConfigMapChecksum } from "./DependsOn";

export type ServerDeploymentArgs = {
    config: Configuration
    dynamicConfig: ServerDynamicConfigMap
    serverConfigTemplate: ServerConfigTemplateMap
    initConfig: ServerInitConfigMap
}

export class ServerDeployment {
    public readonly deployment: k8s.apps.v1.Deployment;
    public readonly matchLabels: MatchLabels;
    public readonly configChecksum: pulumi.Output<string>;

    constructor({ config, dynamicConfig, serverConfigTemplate, initConfig }: ServerDeploymentArgs, opts?: ResourceOptions) {
        const deploymentName = config.name.subcomponent("server");
        const name = deploymentName.name;
        this.matchLabels = {
            app: name,
        };

        const dependsOnConfigMaps: k8s.core.v1.ConfigMap[] = [
            initConfig.configMap,
            serverConfigTemplate.configMap,
            dynamicConfig.configMap,
        ]

        this.configChecksum = DependencyConfigMapChecksum(dependsOnConfigMaps).apply(v => v + config.checksum);

        const adminToolsVersion = config.adminToolsVersion;
        const temporalEnv: k8s.types.input.core.v1.EnvVar[] = [
            {
                name: "TEMPORAL_CONFIG_CHECKSUM",
                value: this.configChecksum,
            },
            {
                name: "POD_IP",
                valueFrom: {
                    fieldRef: {
                        fieldPath: "status.podIP",
                    },
                },
            },
            {
                name: "DB",
                value: "postgresql",
            },
            {
                name: "DB_PORT",
                value: config.persistence.port.toString(),
            },
            {
                name: "POSTGRES_USER",
                value: config.persistence.username,
            },
            {
                name: "POSTGRES_PWD",
                value: config.persistence.password,
            },
            {
                name: "POSTGRES_SEEDS",
                value: config.persistence.host,
            },
            {
                name: "DBNAME",
                value: config.persistence.default.databaseName,
            },
            {
                name: "VISIBILITY_DBNAME",
                value: config.persistence.visibility.databaseName,
            },
            {
                name: "SQL_TLS",
                value: "true",
            },
            {
                name: "SQL_TLS_DISABLE_HOST_VERIFICATION",
                value: "true",
            }
        ];
        this.deployment = new k8s.apps.v1.Deployment(name, {
            metadata: {
                name: name,
                namespace: opts?.namespace,
                // annotations: {
                //     "checksum/config": pulumi.interpolate`${config.require("configChecksum")}`,
                // },
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: this.matchLabels,
                },
                template: {
                    metadata: {
                        labels: this.matchLabels,
                    },
                    spec: {
                        containers: [{
                            name: "temporal-server",
                            image: `temporalio/server:${config.version}`,
                            // imagePullPolicy: config.require("pullPolicy"),
                            ports: [{
                                name: "grpc",
                                containerPort: config.frontend.servicePort,
                                protocol: "TCP",
                            }],
                            livenessProbe: {
                                initialDelaySeconds: 10,
                                tcpSocket: {
                                    port: "grpc",
                                },
                            },
                            readinessProbe: {
                                initialDelaySeconds: 10,
                                tcpSocket: {
                                    port: "grpc",
                                },
                            },
                            env: temporalEnv,
                            volumeMounts: [
                                {
                                    name: "config",
                                    mountPath: "/etc/temporal/config/config_template.yaml",
                                    subPath: "config_template.yaml",
                                },
                                {
                                    name: "dynamicconfig",
                                    mountPath: "/etc/temporal/dynamic_config",
                                },
                            ],
                            // resources: config.getObject("resources"), // TODO: Add resources
                        }],
                        initContainers: [{
                            name: "init",
                            image: pulumi.interpolate`temporalio/admin-tools:${adminToolsVersion}`,
                            command: ["/temporal-init/init.sh"],
                            env: temporalEnv,
                            volumeMounts: [{
                                name: "init-script",
                                mountPath: "/temporal-init/",
                                readOnly: true,
                            }],
                        }],
                        // nodeSelector: , // TODO: Add nodeSelector
                        // affinity: , // TODO: Add affinity
                        // tolerations:, // TODO: Add tolerations
                        volumes: [
                            {
                                name: "init-script",
                                configMap: {
                                    name: initConfig.name,
                                    defaultMode: 0o777,
                                },
                            },
                            {
                                name: "config",
                                configMap: {
                                    name: serverConfigTemplate.name,
                                },
                            },
                            {
                                name: "dynamicconfig",
                                configMap: {
                                    name: dynamicConfig.name,
                                    items: [{
                                        key: "dynamic_config.yaml",
                                        path: "dynamic_config.yaml",
                                    }],
                                },
                            },
                        ],
                    },
                },
            },
        }, {
            ...opts,
            dependsOn: dependsOnConfigMaps,
        });
    }
}
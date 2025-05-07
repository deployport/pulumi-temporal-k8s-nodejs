import * as k8s from "@pulumi/kubernetes";
import { ComponentName } from "./ComponentName";
import { Configuration } from "./Configuration";
import { ResourceOptions } from './ResourceOptions';

/**
 * Class to create the server config map for Temporal server configuration template file
 */
export class ServerConfigTemplateMap {
  public readonly configMap: k8s.core.v1.ConfigMap;
  private readonly componentName: ComponentName;

  get name(): string {
    return this.componentName.name;
  }

  constructor(parent: ComponentName, config: Configuration, opts?: ResourceOptions) {
    const configMapName = parent.subcomponent("config");
    this.componentName = configMapName;
    const name = this.name;
    const pluginDriverName = 'postgres12';

    this.configMap = new k8s.core.v1.ConfigMap(name, {
      metadata: {
        name: name,
        namespace: opts?.namespace,
      },
      data: {
        "config_template.yaml": `
log:
  stdout: true
  level: "${config.logLevel}"
persistence:
  defaultStore: default
  visibilityStore: visibility
  numHistoryShards: ${config.numHistoryShards}
  datastores:
    default:
      sql:
        pluginName: "${pluginDriverName}"
        driverName: "${pluginDriverName}"
        databaseName: "{{ .Env.DBNAME }}"
        connectAddr: "{{ .Env.POSTGRES_SEEDS }}:{{ .Env.DB_PORT }}"
        connectProtocol: "tcp"
        user: "{{ .Env.POSTGRES_USER }}"
        password: "{{ .Env.POSTGRES_PWD }}"
        maxConnLifetime: "${config.persistence.default.connPool.maxConnLifetime}"
        maxIdleConns: ${config.persistence.default.connPool.maxIdleConns}
        maxConns: ${config.persistence.default.connPool.maxConns}
        tls:
          enabled: {{ .Env.SQL_TLS }}
          enableHostVerification: {{ .Env.SQL_TLS_ENABLE_HOST_VERIFICATION }}
    visibility:
      sql:
        pluginName: "${pluginDriverName}"
        driverName: "${pluginDriverName}"
        databaseName: "{{ .Env.VISIBILITY_DBNAME }}"
        connectAddr: "{{ .Env.POSTGRES_SEEDS }}:{{ .Env.DB_PORT }}"
        connectProtocol: "tcp"
        user: "{{ .Env.POSTGRES_USER }}"
        password: "{{ .Env.POSTGRES_PWD }}"
        maxConnLifetime: "${config.persistence.visibility.connPool.maxConnLifetime}"
        maxIdleConns: ${config.persistence.visibility.connPool.maxIdleConns}
        maxConns: ${config.persistence.visibility.connPool.maxConns}
        tls:
          enabled: {{ .Env.SQL_TLS }}
          enableHostVerification: {{ .Env.SQL_TLS_ENABLE_HOST_VERIFICATION }}
global:
  membership:
    name: temporal
    maxJoinDuration: 30s
    broadcastAddress: "{{ default .Env.POD_IP "0.0.0.0" }}"
  pprof:
    port: 7936
services:
  frontend:
    rpc:
      grpcPort: ${config.frontend.servicePort}
      membershipPort: ${config.frontend.membershipPort}
      bindOnIP: "0.0.0.0"
  history:
    rpc:
      grpcPort: ${config.history.servicePort}
      membershipPort: ${config.history.membershipPort}
      bindOnIP: "0.0.0.0"
  matching:
    rpc:
      grpcPort: ${config.matching.servicePort}
      membershipPort: ${config.matching.membershipPort}
      bindOnIP: "0.0.0.0"
  worker:
    rpc:
      grpcPort: ${config.worker.servicePort}
      membershipPort: ${config.worker.membershipPort}
      bindOnIP: "0.0.0.0"
clusterMetadata:
  enableGlobalDomain: false
  failoverVersionIncrement: 10
  masterClusterName: "active"
  currentClusterName: "active"
  clusterInformation:
    active:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "temporal-frontend"
      rpcAddress: "127.0.0.1:7933"
dcRedirectionPolicy:
  policy: "noop"
  toDC: ""
archival:
  status: "disabled"
publicClient:
  hostPort: "0.0.0.0:${config.frontend.servicePort}"
dynamicConfigClient:
  filepath: "/etc/temporal/dynamic_config/dynamic_config.yaml"
  pollInterval: "30s"
`
      }
    }, opts);
  }
}
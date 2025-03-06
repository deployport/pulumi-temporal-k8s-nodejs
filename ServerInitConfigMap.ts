import * as k8s from "@pulumi/kubernetes";
import { ComponentName } from "./ComponentName";
import { ResourceOptions } from "./ResourceOptions";
import { Configuration } from "./Configuration";

export class ServerInitConfigMap {
  public readonly configMap: k8s.core.v1.ConfigMap;
  private readonly componentName: ComponentName;

  get name(): string {
    return this.componentName.name;
  }

  constructor(config: Configuration, opts?: ResourceOptions) {
    const configMapName = config.name.subcomponent("init-script-configmap");
    this.componentName = configMapName;
    const name = this.name;

    const schemaDirName = 'v12'
    const temporalNamespaces: string[] = [
      'default',
      ...config.additionalNamespaces,
    ];

    this.configMap = new k8s.core.v1.ConfigMap(name, {
      metadata: {
        name: name,
        namespace: opts?.namespace,
      },
      data: {
        "init.sh": `#!/bin/bash
  set -e
  export SQL_USER=$POSTGRES_USER;
  export SQL_PASSWORD=\$POSTGRES_PWD;
  echo "main database schema";
  temporal-sql-tool --plugin postgres --ep "\${POSTGRES_SEEDS}" -u "\${POSTGRES_USER}" -p "\${DB_PORT}" --db "\${DBNAME}" setup-schema -v 0.0;
  export SCHEMA_DIR=/etc/temporal/schema/postgresql/${schemaDirName}/temporal/versioned;
  temporal-sql-tool --plugin postgres --ep "\${POSTGRES_SEEDS}" -u "\${POSTGRES_USER}" -p "\${DB_PORT}" --db "\${DBNAME}" update-schema -d "\${SCHEMA_DIR}";
  echo "visibility database schema";
  export VISIBILITY_SCHEMA_DIR=/etc/temporal/schema/postgresql/${schemaDirName}/visibility/versioned;
  temporal-sql-tool --plugin postgres --ep "\${POSTGRES_SEEDS}" -u "\${POSTGRES_USER}" -p "\${DB_PORT}" --db "\${VISIBILITY_DBNAME}" setup-schema -v 0.0;
  temporal-sql-tool --plugin postgres --ep "\${POSTGRES_SEEDS}" -u "\${POSTGRES_USER}" -p "\${DB_PORT}" --db "\${VISIBILITY_DBNAME}" update-schema -d "\${VISIBILITY_SCHEMA_DIR}";

  echo "ok";
  `,
        "create-default-ns.sh": `#!/bin/bash
  set -e

  export TEMPORAL_CLI_ADDRESS="${config.frontend.serviceName.name}:${config.frontend.servicePort}"
  export DEFAULT_NAMESPACE_RETENTION="1"

  register_namespace() {
    local namespace=$1
    echo "Registering namespace: \${namespace}.";
    if ! tctl --ns "\${namespace}" namespace describe; then
      echo "Namespace \${namespace} not found. Creating..."
      tctl --ns "\${namespace}" namespace register --rd "\${DEFAULT_NAMESPACE_RETENTION}" --desc "Namespace for Temporal Server."
      echo "Namespace \${namespace} registration complete."
    else
      echo "Namespace \${namespace} already registered."
    fi
  }
  namespaces=(${temporalNamespaces.map(ns => '"' + ns + '"').join(' ')})
  for namespace in \${namespaces[@]}; do
    register_namespace \${namespace}
  done

  echo "ok";
  `
      }
    }, opts);
  }
}

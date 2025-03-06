import * as k8s from "@pulumi/kubernetes";
import { ComponentName } from "./ComponentName";
import { ResourceOptions } from "./ResourceOptions";

export class ServerDynamicConfigMap {
  public readonly configMap: k8s.core.v1.ConfigMap;
  private readonly componentName: ComponentName;

  get name(): string {
    return this.componentName.name;
  }

  constructor(parent: ComponentName, opts?: ResourceOptions) {
    const configMapName = parent.subcomponent("dynamicconfig-configmap");
    this.componentName = configMapName;
    const name = this.name;

    this.configMap = new k8s.core.v1.ConfigMap(name, {
      metadata: {
        name: name,
        namespace: opts?.namespace,
      },
      data: {
        "dynamic_config.yaml": `
frontend.limit.blobSize.error:
  - value: 3670016
frontend.workerVersioningDataAPIs:
  - value: true
frontend.workerVersioningWorkflowAPIs:
  - value: true
worker.buildIdScavengerEnabled:
  - value: true
`
      }
    }, opts);
  }
}

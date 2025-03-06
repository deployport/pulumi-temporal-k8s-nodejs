import * as k8s from "@pulumi/kubernetes";
import { Output, Input, Resource, all } from "@pulumi/pulumi";
import * as crypto from "crypto";

/**
 * Computes a checksum of the data in the ConfigMap objects.
 * This is used to trigger a rolling update of the Deployment when the ConfigMap data changes.
 * @param dependsOnConfigMaps 
 * @returns 
 */
export function DependencyConfigMapChecksum(dependsOnConfigMaps: k8s.core.v1.ConfigMap[]): Output<string> {
    return all(dependsOnConfigMaps.map(cm => cm.data)).apply(datas => {
        const hash = crypto.createHash("sha256");
        hash.update(JSON.stringify(datas || {}));
        return hash.digest("hex");
    });
}

export type DependsOn = Input<Resource>[];

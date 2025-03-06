import * as pulumi from "@pulumi/pulumi";

export interface ResourceOptions extends pulumi.CustomResourceOptions {
    namespace: pulumi.Output<string>
}

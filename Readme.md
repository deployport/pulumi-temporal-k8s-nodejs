## pulumi-temporal-k8s-nodejs

| Deploy Temporal Server and UI on Kubernetes using Pulumi Native Provider

## Installation

```
npm i @deployport/pulumi-temporal-k8s-nodejs
```

## Usage

```
import * as kubernetes from "@pulumi/kubernetes";
import { ComponentName, Configuration, Stack } from "@deployport/pulumi-temporal-k8s-nodejs";

const config = new Configuration({
    rootName: new ComponentName('temporal'),
});
config.additionalNamespaces.push('fastns', 'slowns');

const namespace = new kubernetes.core.v1.Namespace('temporal', {
    metadata: {
        name: 'temporal',
    },
}, {
    provider: kubernetesProvider,
})

const opts = { provider: kubernetesProvider, namespace: namespace.metadata.name };
const stack = new Stack({ config }, opts);
```

## License

MIT

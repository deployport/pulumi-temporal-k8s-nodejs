## pulumi-temporal-k8s-nodejs

Deploy [Temporal](https://temporal.io/) [Open-Source Workflow Server](https://learn.temporal.io/getting_started) and UI on Kubernetes using Pulumi Native Provider

## Installation

```sh
npm i @deployport/pulumi-temporal-k8s-nodejs
```

## Simple Usage

```ts
import { Configuration, Stack } from "@deployport/pulumi-temporal-k8s-nodejs";

const config = new Configuration({});
const stack = new Stack({ config });
```

Run the following commands with your values in order to set configurations for the current pulumi stack:

- `pulumi config set temporal:databaseHost <postgres database host>`
- `pulumi config set temporal:databaseUsername <postgres user name>`
- `pulumi config set --secret temporal:databasePassword` which prompts for the database password to use

Make sure the user is owner of both `temporal` and `temporal_visibility` databases in the postgres server.

## Advanced Usage

```ts
import * as kubernetes from "@pulumi/kubernetes";
import {
  ComponentName,
  Configuration,
  Stack,
} from "@deployport/pulumi-temporal-k8s-nodejs";

const config = new Configuration({
  rootName: new ComponentName("temporal"),
});
config.additionalNamespaces.push("fastns", "slowns");

const namespace = new kubernetes.core.v1.Namespace(
  "temporal",
  {
    metadata: {
      name: "temporal",
    },
  },
  {
    provider: kubernetesProvider,
  }
);

const opts = {
  provider: kubernetesProvider,
  namespace: namespace.metadata.name,
};
const stack = new Stack({ config }, opts);
```

## License

MIT

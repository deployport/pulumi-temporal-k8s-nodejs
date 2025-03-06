import { Config as PulumiConfig, Input } from "@pulumi/pulumi";
import { inferAdminToolVersion } from "./AdminTools";
import { ComponentName } from "./ComponentName";
import { createHash } from "crypto";

export interface PostgresConnPool {
    /**
     * Maximum duration a connection may be reused. You can use Go duration format such as 10m, 1h,etc
     */
    maxConnLifetime: Input<string>;
    maxIdleConns: Input<number>;
    maxConns: Input<number>;
}

export interface DatabaseConn {
    /**
     * Connection pool configuration for the database
     */
    connPool: PostgresConnPool;
    /**
     * Name of the database in the database server
     */
    databaseName: Input<string>;
}

export interface Persistence {
    default: DatabaseConn;
    visibility: DatabaseConn;

    username: Input<string>;
    password: Input<string>;
    host: Input<string>;
    port: Input<number>;
}

export type SupportedServerVersion = '1.23.1';

function IsValidServerVersion(version: string): version is SupportedServerVersion {
    return version === '1.23.1';
}

export type FrontendConfig = {
    membershipPort: number
    servicePort: number
    serviceName: ComponentName
}

export type ConfigurationArgs = {
    rootName?: ComponentName
    bag?: PulumiConfig
}

export class Configuration {
    readonly name: ComponentName
    persistence: Persistence
    frontend: FrontendConfig
    history: {
        membershipPort: number
        servicePort: number
    }
    matching: {
        membershipPort: number
        servicePort: number
    }
    worker: {
        membershipPort: number
        servicePort: number
    }
    numHistoryShards: number
    logLevel: string
    version: SupportedServerVersion
    explicitAdminToolsVersion: string | null = null
    ui: {
        corsOrigins: string[]
        csrfCookieInsecure: boolean
        port: number
        version: string
    }

    /**
     * The `default` namespace is initialized automatically. Additional namespaces namespaces can be added here to be initialized on startup.
     */
    additionalNamespaces: string[] = [];

    constructor({ rootName, bag }: ConfigurationArgs) {
        this.name = rootName || new ComponentName('temporal');
        if (!bag) {
            bag = new PulumiConfig(this.name.toString());
        }
        const connPoll = {
            maxConnLifetime: bag.get('databaseMaxConnLifetime') || "2m",
            maxIdleConns: bag.getNumber('databaseMaxIdleConns') || 10,
            maxConns: bag.getNumber('databaseMaxConns') || 100,
        };
        this.persistence = {
            default: {
                connPool: connPoll,
                databaseName: bag.get('databaseDefaultName') || 'temporal'
            },
            visibility: {
                connPool: connPoll,
                databaseName: bag.get('databaseVisibilityName') || 'temporal_visibility'
            },
            username: bag.get('databaseUsername') || '',
            password: bag.getSecret('databasePassword') || '',
            host: bag.get('databaseHost') || '',
            port: bag.getNumber('databasePort') || 5432
        };
        this.frontend = {
            membershipPort: 6933,
            servicePort: 7233,
            serviceName: this.name,
        };
        this.history = {
            membershipPort: 6934,
            servicePort: 7234
        };
        this.matching = {
            membershipPort: 6935,
            servicePort: 7235
        };
        this.worker = {
            membershipPort: 6939,
            servicePort: 7239
        };
        this.numHistoryShards = bag.getNumber('numHistoryShards') || 512;
        this.logLevel = bag.get('logLevel') || 'debug,info';
        this.version = bag.get('version') || '1.23.1';
        this.ui = {
            corsOrigins: [],
            csrfCookieInsecure: false,
            port: 80,
            version: bag.get('uiVersion') || '2.29.2'
        };
    }

    validate() {
        const persistence = this.persistence;
        if (persistence.default.databaseName === persistence.visibility.databaseName) {
            throw new Error('default and visibility database names must be different');
        }
        if (!persistence.username) {
            throw new Error('database username must be provided');
        }
        if (!persistence.password) {
            throw new Error('database password must be provided');
        }
        if (!persistence.host) {
            throw new Error('database host must be provided');
        }
        if (!IsValidServerVersion(this.version)) {
            throw new Error(`unsupported temporal version: ${this.version}`);
        }
    }

    get checksum(): string {
        const hash = createHash("sha256");
        hash.update(JSON.stringify(this));
        return hash.digest("hex");
    }

    /**
     * The version of the admin tools to use. If not explicitly set, it will be inferred from the server version.
     */
    get adminToolsVersion(): string {
        return this.explicitAdminToolsVersion || inferAdminToolVersion(this.version);
    }
}
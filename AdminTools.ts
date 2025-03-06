import { SupportedServerVersion } from "./Configuration";

/**
 * mapping of each key(temporal server version) to the corresponding admin tools version
 * docker image.
 * See https://hub.docker.com/r/temporalio/admin-tools/tags
 * and https://github.com/temporalio/temporal/releases
 */
const adminToolVersions: Record<SupportedServerVersion, string> = {
    '1.23.1': '1.23.1.0',
};

/**
 * Returns the admin tools version that corresponds to the given server version.
 * If the server version is not found in the mapping, the server version is returned.
 * @param serverVersion the server version
 * @returns 
 */
export function inferAdminToolVersion(serverVersion: SupportedServerVersion): string {
    return adminToolVersions[serverVersion] || serverVersion;
}
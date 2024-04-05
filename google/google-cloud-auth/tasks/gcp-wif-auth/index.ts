import * as tasks from 'azure-pipelines-task-lib';

import { WorkloadIdentityFederationClient } from './auth-client';
import { AdoService } from './ado-service';

async function run() {
    const connectedServiceId = tasks.getInputRequired("connectedServiceId");
    const workloadIdentityProvider = tasks.getEndpointAuthorizationParameterRequired(connectedServiceId, "workloadIdentityProvider");
    const serviceAccount = tasks.getInput("serviceAccount", false) || tasks.getEndpointAuthorizationParameter(connectedServiceId, "serviceAccount", true);

    const universe = tasks.getEndpointAuthorizationParameter(connectedServiceId, "universe", true);

    const adoService = AdoService.forPipelineServiceConnection(connectedServiceId);
    const authClient = new WorkloadIdentityFederationClient(adoService, workloadIdentityProvider, serviceAccount, universe);

    tasks.debug(`Requesting Azure DevOps OIDC Token for configured service connection. ConnectedServiceId=${connectedServiceId}`);
    const oidcToken = await adoService.createOidcToken();
    if (!oidcToken) {
        throw new Error("Failed to retrieve OIDC token. Is this pipeline authorized to use the configured 'connectedServiceId'?");
    }

    tasks.debug(`Exchanging OIDC token for a Google OAuth 2.0 access token. WorkloadIdentityProvider=${workloadIdentityProvider}, ServiceAccount=${serviceAccount}`);
    const googleAuthToken = await authClient.getAccessToken(oidcToken);
    if (!googleAuthToken) {
        throw new Error(`Failed to generate GCP access token. Does the workload identity provider pool trust Azure DevOps OIDC-tokens? Is the 'iam.workloadIdentityUser'-role granted to the workload identity provider pool for the service account? WorkloadIdentityProvider=${workloadIdentityProvider} ServiceAccount=${serviceAccount}`)
    }

    tasks.debug(`Configuring credential file for tool integration.`)
    const tempPath = getTempDirectory();
    const credentialsPath = await authClient.createExecutableCredentialsFile(tempPath);

    tasks.setVariable("credentialsFilePath", credentialsPath, false, true);

    const configuredCredentialsPath = tasks.getVariable("GOOGLE_APPLICATION_CREDENTIALS");
    if (configuredCredentialsPath) {
        console.log(`Reusing configured google credentials: ${configuredCredentialsPath} (from GOOGLE_APPLICATION_CREDENTIALS)`);
    } else {
        tasks.setVariable("GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES", "1");
        tasks.setVariable("CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE", credentialsPath);
        tasks.setVariable("GOOGLE_APPLICATION_CREDENTIALS", credentialsPath);
    }
}

function getTempDirectory(): string {
    const tempPath = tasks.getVariable('Agent.TempDirectory');
    if (!tempPath) {
        throw new Error("Expected Agent.TempDirectory to be set");
    }

    return tempPath;
}

run().catch(reason => tasks.setResult(tasks.TaskResult.Failed, reason));

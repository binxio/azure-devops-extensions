import * as tasks from 'azure-pipelines-task-lib';

import { getSystemAccessToken } from 'azure-pipelines-tasks-artifacts-common/webapi';
import { getHandlerFromToken, WebApi } from "azure-devops-node-api";
import { ITaskApi } from "azure-devops-node-api/TaskApi";

export interface PipelineContext {
    serverUrl: string;
    scopeIdentifier: string;
    hubName: string;
    planId: string;
    jobId: string;
    serviceConnectionId: string;
}

export interface AdoOidcTokenEndpoint {
    requestUrl: string;
    accessToken: string;
    apiVersion?: string;
}

// See: https://google.aip.dev/auth/4117#determining-the-subject-token-in-microsoft-azure-and-url-sourced-credentials
export interface AdoCredentialSource {
    url: string;
    headers: Record<string, string>;
    format: AdoCredentialSourceFormat;
}


export interface AdoCredentialSourceFormat {
    type: string;
    subject_token_field_name: string;
}

export class AdoService {

    private readonly context: PipelineContext;
 
    constructor(context: PipelineContext) {
        this.context = context;
    }

    public static forPipelineServiceConnection(connectedServiceId: string): AdoService {
        let uri = tasks.getVariable("System.CollectionUri");
        if (!uri) {
            uri = tasks.getVariable("System.TeamFoundationServerUri");
        }
    
        const projectId = tasks.getVariable("System.TeamProjectId");
        const hub = tasks.getVariable("System.HostType");
        const planId = tasks.getVariable('System.PlanId');
        const jobId = tasks.getVariable('System.JobId');

        return new AdoService({
            serverUrl: uri!,
            scopeIdentifier: projectId!,
            hubName: hub!,
            planId: planId!,
            jobId: jobId!,
            serviceConnectionId: connectedServiceId,
        });
    }

    public async createOidcToken(): Promise<string | undefined> {
        const token = getSystemAccessToken();
        const authHandler = getHandlerFromToken(token);
        const webApi = new WebApi(this.context.serverUrl, authHandler);
        const taskApi: ITaskApi = await webApi.getTaskApi();

        return taskApi
            .createOidcToken({}, this.context.scopeIdentifier, this.context.hubName, this.context.planId, this.context.jobId, this.context.serviceConnectionId)
            .then<string | undefined, undefined>(
                result => result.oidcToken,
                reason => {
                    tasks.warning(`Failed to create OIDC token based on pipeline context. ServiceConnection=${this.context.serviceConnectionId}, Reason=${reason}`);
                    return undefined;
                });
    }

    public async getOidcTokenEndpoint(): Promise<AdoOidcTokenEndpoint> {
        const token = getSystemAccessToken();
        const authHandler = getHandlerFromToken(token);
        const webApi = new WebApi(this.context.serverUrl, authHandler);

        let routeValues = {
            scopeIdentifier: this.context.scopeIdentifier,
            hubName: this.context.hubName,
            planId: this.context.planId,
            jobId: this.context.jobId,
        }

        let queryValues = {
            serviceConnectionId: this.context.serviceConnectionId,
        }

        // Reference: https://github.com/microsoft/azure-devops-node-api/blob/1351c2c696a539ea0c89ff3fc54ce1dd55e45114/api/TaskApi.ts#L913
        let versioningData = await webApi.vsoClient.getVersioningData(
            "7.2-preview.1",
            "distributedtask",
            "69a319f4-28c1-4bfd-93e6-ea0ff5c6f1a2",
            routeValues,
            queryValues);

        tasks.debug(`Negotiated token url and version. Url=${versioningData.requestUrl}, Version=${versioningData.apiVersion}`);
        return {
            requestUrl: versioningData.requestUrl!,
            accessToken: token,
            apiVersion: versioningData.apiVersion,
        };
    }
}


import * as tasks from 'azure-pipelines-task-lib';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path'

import { randomBytes } from 'crypto';

import { HttpClient } from 'typed-rest-client/HttpClient';
import { BearerCredentialHandler } from 'typed-rest-client/Handlers'
import { IHeaders } from 'typed-rest-client/Interfaces';

import { AdoService } from './ado-service';

export class WorkloadIdentityFederationClient {
    private readonly adoService: AdoService;
    private readonly workloadIdentityProviderName: string
    private readonly serviceAccount?: string
    private readonly universe: string;
  
    constructor(adoService: AdoService, workloadIdentityProviderName: string, serviceAccount?: string, universe?: string) {
        this.adoService = adoService;
        this.workloadIdentityProviderName = workloadIdentityProviderName;
        this.serviceAccount = serviceAccount;
        this.universe = universe ?? "googleapis.com";
    }

    public async getAccessToken(oidcToken: string): Promise<string | undefined> {
        tasks.debug(`Generating access token for workload identity provider pool. WorkloadIdentityProvider=${this.workloadIdentityProviderName}`);
        const providerAccessToken = await this.getWorkloadIdentityProviderAccessToken(oidcToken);
        if (!providerAccessToken) {
            tasks.warning(`Failed to retrieve workload identity provider pool token. Does the workload identity provider pool trust Azure DevOps OIDC-tokens? WorkloadIdentityProvider=${this.workloadIdentityProviderName}`)
            return undefined;
        }

        if (!this.serviceAccount) {
            // No further impersonation required. Return provider access token.
            return providerAccessToken;
        }

        tasks.debug(`Generating access token for service account. ServiceAccount=${this.serviceAccount}`);
        const serviceAccountToken = await this.getServiceAccountAccessToken(providerAccessToken);
        if (!serviceAccountToken) {
            tasks.warning(`Failed to generate access token for service account. Did you grant 'iam.workloadIdentityUser'-role for this pipeline to the service account? WorkloadIdentityProvider=${this.workloadIdentityProviderName}, ServiceAccount=${this.serviceAccount}`);
            return undefined;
        }

        return serviceAccountToken;
    }

    public async createExecutableCredentialsFile(outputPath: string): Promise<string> {
        const rand = randomBytes(8).toString('hex');

        const tokenEndpoint = await this.adoService.getOidcTokenEndpoint();
        const scriptTokens = new Map([
            ["##URL##", tokenEndpoint.requestUrl],
            ["##TOKEN##", tokenEndpoint.accessToken],
            ["##VERSION##", tokenEndpoint.apiVersion || ""],
        ]);
        const scriptPath = path.join(outputPath, `ado-creds-${rand}.js`);
        let scriptContent = fs.readFileSync(path.join(__dirname, "ado-creds-refresh.js")).toString()
            .replace(/##.+##/g, m => scriptTokens.get(m) || m);
        tasks.writeFile(scriptPath, scriptContent);
        
        const credential: Record<string, any> = {
            type: "external_account",
            audience: `//iam.${this.universe}/${this.workloadIdentityProviderName}`,
            subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
            token_url: `https://sts.${this.universe}/v1/token`,
            credential_source: {
                executable: {
                    command: `${process.execPath} ${scriptPath}`,
                },
            },
        };

        if (this.serviceAccount) {
            const impersonationURL = `https://iamcredentials.${this.universe}/v1/projects/-/serviceAccounts/${this.serviceAccount}:generateAccessToken`;
            credential.service_account_impersonation_url = impersonationURL;
        }
        
        const filePath = path.join(outputPath, `ado-creds-${rand}.json`);
        tasks.writeFile(filePath, JSON.stringify(credential), { mode: 0o640, flag: 'wx' });
        return filePath;
    }

    private async getWorkloadIdentityProviderAccessToken(oidcToken: string): Promise<string | undefined> {
        const userAgent = `ado-gcp-auth/1.0.0 (${os.platform()} ${os.release()})`
        const client = new HttpClient(userAgent);

        const uri = `https://sts.${this.universe}/v1/token`;
        const headers: IHeaders = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        const body = {
            audience: `//iam.${this.universe}/${this.workloadIdentityProviderName}`,
            grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
            requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
            scope: `https://www.${this.universe}/auth/cloud-platform`,
            subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
            subjectToken: oidcToken,
        };

        const response = await client.post(uri, JSON.stringify(body, null, 2), headers);
        const statusCode = response.message.statusCode || 0;
        if (statusCode == 404) {
            throw new Error(`Failed to retrieve workload identity provider pool token. Token endpoint was not found. Uri=${uri}`);
        }

        let obj: any;
        try {
            let contents = await response.readBody()
            obj = JSON.parse(contents)
        } catch (err) {
            // Unexpected response content. Leaving result empty
        }

        return obj?.access_token;
    }

    private async getServiceAccountAccessToken(token: string): Promise<string | undefined> {
        const userAgent = `ado-gcp-auth/1.0.0 (${os.platform()} ${os.release()})`
        
        const credentialHandler = new BearerCredentialHandler(token);
        const client = new HttpClient(userAgent, [credentialHandler]);

        const uri = `https://iamcredentials.${this.universe}/v1/projects/-/serviceAccounts/${this.serviceAccount}:generateAccessToken`;
        const headers: IHeaders = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        const body = {
            scope: `https://www.${this.universe}/auth/cloud-platform`,
            lifetime: "600s",
        };

        const response = await client.post(uri, JSON.stringify(body, null, 2), headers);
        const statusCode = response.message.statusCode || 0;
        if (statusCode == 404) {
            throw new Error(`Failed to retrieve workload identity provider pool token. IAM Credentials endpoint was not found. Uri=${uri}`);
        }

        let obj: any;
        try {
            let contents = await response.readBody()
            obj = JSON.parse(contents)
        } catch (err) {
            // Unexpected response content. Leaving result empty
        }

        return obj?.accessToken;
    }
}
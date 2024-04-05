# Authenticate to Google Cloud from Azure DevOps

## Overview

This package contains Azure DevOps Pipeline tasks and endpoints to authenticate to Google Cloud in a build or release pipeline.

This extension contains the following contributions:

* gcp wif auth - for authenticating using workload identity federation
* gcp wif endpoint - to manage workload identity provider pool references

The tasks are capable of running on the following build agent operating systems:

* Windows
* MacOS
* Linux

## Learn

### Using the extension

1. Configure Google Cloud Workload Identity Federation for Azure DevOps

* Terraform example: [gcp-workload-identity-federation-azure-devops-example](https://github.com/binxio/gcp-workload-identity-federation-azure-devops-example/tree/main/terraform)

2. Setup Azure DevOps Pipeline

* YAML example: [gcp-workload-identity-federation-azure-devops-example](https://github.com/binxio/gcp-workload-identity-federation-azure-devops-example/tree/main/azure-pipelines)

## Contact Information

Please report any problem or feedback at [GitHub](https://github.com/binxio/azure-devops-extensions/tree/master/google/google-cloud-auth).
# Google Cloud SDK Extension for Azure DevOps

## Overview

This repo contains the Azure DevOps Pipeline tasks for installing Google Cloud SDK in a build or release pipeline.

This extension contains the following contributions:

* Google Cloud SDK tool installer - for installing Google Cloud SDK if not installed on the build agent
* gcloud runner - for executing gcloud commands
* gsutil runner - for executing gsutil commands

The tasks are capable of running on the following build agent operating systems:

* Windows (Adding components seems to fail)
* MacOS
* Linux

## Learn

### Using the extension

* Blog: [Using Google Service Accounts In Azure Pipelines](https://binx.io/blog/2020/05/08/using-google-service-accounts-in-azure-pipelines/)

## Understanding the implementation

* Blog: [https://binx.io/blog/2020/04/28/creating-a-google-cloud-sdk-installer-for-azure-pipelines/](https://binx.io/blog/2020/04/28/creating-a-google-cloud-sdk-installer-for-azure-pipelines/)

## Contact Information

Please report any problem or feedback at [GitHub](https://github.com/binxio/azure-devops-extensions/tree/master/google/google-cloud-sdk).
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

## Contact Information

Please report any problem or feedback at [GitHub](https://github.com/binxio/azure-devops-extensions/tree/master/google/google-cloud-sdk).
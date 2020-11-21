# Google Cloud SDK - Azure DevOps Extensions

This project implements Azure DevOps extensions for Google Cloud Platform.

Read[Creating a Google Cloud SDK Installer for Azure Pipelines](https://binx.io/blog/2020/04/28/creating-a-google-cloud-sdk-installer-for-azure-pipelines/) for details.

## Structure

The extensions are organized by vendor and require a tasks folder containing all task implementations.

> /{vendor}/{extension}/tasks/{task source}

## Release

Release using the tasksfile-script:

    npm ci
    npx task release VENDOR EXTENSION

Or use Make:

    make release VENDOR=vendor EXTENSION=extension

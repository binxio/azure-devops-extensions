# Azure DevOps Extensions

This project implements Azure DevOps extensions such as Tool installers and so forth.

## Structure

The extensions are organized by vendor and require a tasks folder containing all task implementations.

> /{vendor}/{extension}/tasks/{task source}

## Release

Release using the tasksfile-script:

    npm ci
    npx task release VENDOR EXTENSION

Or use Make:

    make release VENDOR=vendor EXTENSION=extension
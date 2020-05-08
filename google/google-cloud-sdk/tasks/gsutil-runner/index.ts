import * as tasks from 'azure-pipelines-task-lib';
import * as tools from 'azure-pipelines-task-lib/toolrunner';

async function run() {
    let command = tasks.getInput("command", true)!;
    let argument = tasks.getInput("arguments", false);
    let workingDir = tasks.getInput("workingDirectory", false);
    let commandOptions = tasks.getInput("commandOptions", false);
    let toolOptions = tasks.getInput("toolOptions", false);

    let toolPath = tasks.which("gsutil", true)!;
    let toolRunner : tools.ToolRunner = tasks.tool(toolPath);

    if (toolOptions) {
        toolRunner.line(toolOptions);
    }

    // Note: Using line instead of arg, because commands consists of command group and command e.g. "acl set"
    toolRunner.line(command);

    if (commandOptions) {
        toolRunner.line(commandOptions);
    }

    if (argument) {
        toolRunner.line(argument);
    }

    return await toolRunner.exec(<tools.IExecOptions>{
        cwd: workingDir
    });
}

run().catch(reason => tasks.setResult(tasks.TaskResult.Failed, reason));
import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const pipeline=new Pipeline(this,"Pipeline",{
      pipelineName: 'newmanpipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    })
    const collection_file=require("../collection_file")
    const environment_file=require("../environment_file")
    const project = new PipelineProject(this, 'MyPipelineProject', {
      buildSpec:BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing Newman...',
              'npm install -g newman'
            ]
          },
          build: {
            commands: [
              'echo Running collections...',
              `newman run ${collection_file} -e ${environment_file}`,
              'if [ $? -ne 0 ]; then exit 1; fi'
            ]
          },
          post_build: {
            commands: [
              'echo Build completed successfully.'
            ]
          }
        }
      })
    });

    const cdkSourceOutput=new Artifact("CDKSourceOutput")
    pipeline.addStage({
      stageName:"source",
      actions:[
        new GitHubSourceAction({
          owner: "Suresh14531453",
            repo: "gittestfilefornewman",
            branch: "master",
            actionName: "Pipeline_Source",
            oauthToken: SecretValue.secretsManager("token_access"),
            output: cdkSourceOutput
        }
        )
      ]
    })
    const cdkBuildOutput=new Artifact("CdkBuildOutPut")
    pipeline.addStage({
      stageName:"build",
      actions: [
        new CodeBuildAction({

          actionName: "CDK_Build",
          input: cdkSourceOutput,
          outputs: [cdkBuildOutput],
          project:project
        }),
      ]
    })

  }
}

// import * as cdk from 'aws-cdk-lib';
// import { SecretValue } from 'aws-cdk-lib';
// import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
// import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
// import { Action, Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
// import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
// import { Construct } from 'constructs';
// import { Topic } from "aws-cdk-lib/aws-sns";
// import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
// // import * as sqs from 'aws-cdk-lib/aws-sqs';
// // import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
// // import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Action, Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export class AwsCdkTestStack extends cdk.Stack {
  private readonly pipelineNotificationsTopic: Topic;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const pipeline=new Pipeline(this,"Pipeline",{
      pipelineName: 'newmanpipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    })
    this.pipelineNotificationsTopic = new Topic(
      this,
      "PipelineNotificationsTopic",
      {
        topicName: "PipelineNotifications",
      }
    );

    this.pipelineNotificationsTopic.addSubscription(
      new EmailSubscription("suresh.sahu@trangile.com")
    );

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
    const buildStage=pipeline.addStage({
      stageName:"build",
      actions: [
        new CodeBuildAction({

          actionName: "CDK_Build",
          input: cdkSourceOutput,
          outputs: [cdkBuildOutput],
          project: new PipelineProject(this, "CdkBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build-specs/cdk-newman-build-spec.yml"
            ),
          }),
          
         
        }),
      ]
    })
    
    pipeline.addStage({
      stageName: "Pipeline_Update",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "Pipeline_Update",
          stackName: "AwsCdkTestStack",
          templatePath: cdkBuildOutput.atPath("AwsCdkTestStack.template.json"),
          adminPermissions: true,
        }),
      ],
      
    });
  }
}

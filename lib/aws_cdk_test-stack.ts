import * as cdk from 'aws-cdk-lib';
import { SecretValue, Stage } from 'aws-cdk-lib';
import { BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage, PipelineProject, Project } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, CodeBuildActionType, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { Topic } from "aws-cdk-lib/aws-sns";
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { RuleTargetInput } from 'aws-cdk-lib/aws-events';

export class AwsCdkTestStack extends cdk.Stack {
  private readonly pipelineNotificationsTopic: Topic;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    this.pipelineNotificationsTopic = new Topic(
      this,
      "PipelineNotificationsTopic",
      {
        topicName: "PipelineNotifications",
      }
    );
    this.pipelineNotificationsTopic.addSubscription(
      new EmailSubscription("sureshsahu1453@gmail.com")
    );    
    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: 'newmanpipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    })

    const cdkSourceOutput = new Artifact("CDKSourceOutput")
    pipeline.addStage({
      stageName: "source",
      actions: [
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

    const cdkBuildOutput = new Artifact("CdkBuildOutPut")
    const buildStage=pipeline.addStage({
      stageName: "build",
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
       
      ],
    });
    const snsTopic = new SnsTopic(this.pipelineNotificationsTopic, {
      message: RuleTargetInput.fromText(
        `Build Test Failed`
      ),
    
    });
    
    buildStage.onStateChange("FAILED", snsTopic, {
      ruleName: "Failed",
      eventPattern: {
        detail: {
          state: ["FAILED"],
        },
      },
      description: "Build Test Failed",
    });
    const snsTopicSuccess = new SnsTopic(this.pipelineNotificationsTopic, {
      message: RuleTargetInput.fromText(
        `Build Test Successful.`
      ),
    });
    
    buildStage.onStateChange("SUCCEEDED", snsTopicSuccess, {
      ruleName: "Success",
      eventPattern: {
        detail: {
          state: ["SUCCEEDED"],
        },
      },
      description: "Build Test Successful",
    });
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
    ///////
    

  }
}

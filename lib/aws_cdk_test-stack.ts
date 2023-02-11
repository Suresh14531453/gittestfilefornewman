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
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { execSync, spawnSync } from 'child_process';

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
    const result = spawnSync('git', ['log', '--format=%H', '-n', '1']);
    const revision = result.stdout.toString().trim().substr(0, 8);
    // const s3Bucket = new Bucket(this, 'MyBucket', {
    //   bucketName: 'cdkbucket',
    //   publicReadAccess: true,
    //   encryption: BucketEncryption.S3_MANAGED,
    //   versioned: true
    // });

    const cdkSourceOutput = new Artifact("CDKSourceOutput")
    pipeline.addStage({
      stageName: "source",
      actions: [
        new GitHubSourceAction({
          owner: "Suresh14531453",
          repo: "gittestfilefornewman",
          branch: "master",
          actionName: "Pipeline_Source",
          oauthToken: SecretValue.secretsManager("git_secret_key"),
          output: cdkSourceOutput
        }
        )
      ]
    })

    const cdkBuildOutput = new Artifact("CdkBuildOutPut")
    const buildStage = pipeline.addStage({
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
            environmentVariables: {
              'IMAGE_TAG': {
                value: '$CODEBUILD_RESOLVED_SOURCE_VERSION'.substr(0, 7),
              },
            }
          }),
        }),

      ],
    });
    // const result = spawnSync('git', ['log', '--format=%H', '-n', '1']);
    // const revision = result.stdout.toString().trim().substr(0, 7);
    const bucketName = 'newpipelinestack-pipelineartifactsbucket22248f97-dttshkqq1xz2';
const reportKey = 'newpipelinestack-pipelineartifactsbucket22248f97-dttshkqq1xz2/reports';
// const htmlReportKey = `newpipelinestack-pipelineartifactsbucket22248f97-dttshkqq1xz2.s3.ap-south-1.amazonaws.com/reports/PPL_Report-${revision}.html`;
const htmlReportKey=`awscdkteststack-pipelineartifactsbucket22248f97-118rqbrpqpc5o.s3.ap-south-1.amazonaws.com/reports/report8-${revision}.html`

    const snsTopic = new SnsTopic(this.pipelineNotificationsTopic, {

      message: RuleTargetInput.fromText(
        `Build Test Failed Check the report in S3 bucket: ${bucketName}. Report file (text): ${reportKey} git commit id is.
        To Download the Report file (HTML): https://${htmlReportKey}`
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
        `Build Test Successed Check the report in S3 bucket: ${bucketName}. Report file (text): ${reportKey}.
      To Download the Report file (HTML): https://${htmlReportKey}`
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
    // const bucket = new Bucket(this, 'MyFirstBucket', {
    //   encryption: BucketEncryption.KMS,
    //   bucketKeyEnabled: true,
    // });

///////////////////////////
  }
}

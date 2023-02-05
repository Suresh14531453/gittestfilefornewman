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
// import * as cdk from 'aws-cdk-lib';
// import { SecretValue } from 'aws-cdk-lib';
// import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
// import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
// import { Action, Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
// import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
// import { Construct } from 'constructs';


// export class AwsCdkTestStack extends cdk.Stack {
  
//   // private readonly pipelineNotificationsTopic: Topic;
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);
//     const pipeline=new Pipeline(this,"Pipeline",{
//       pipelineName: 'newmanpipeline',
//       crossAccountKeys: false,
//       restartExecutionOnUpdate: true,
//     })
    

//     const cdkSourceOutput=new Artifact("CDKSourceOutput")
//     pipeline.addStage({
//       stageName:"source",
//       actions:[
//         new GitHubSourceAction({
//           owner: "Suresh14531453",
//             repo: "gittestfilefornewman",
//             branch: "master",
//             actionName: "Pipeline_Source",
//             oauthToken: SecretValue.secretsManager("token_access"),
//             output: cdkSourceOutput
//         }
//         )
//       ]
//     })
//     const email = 'your.email@example.com';
//     const emailSubject = 'Build Stage Failed';
//     const emailText = 'Your pipeline has failed.';
//     const emailHtml = '<p>Your pipeline has failed.</p>';

//     const cdkBuildOutput=new Artifact("CdkBuildOutPut")
//     pipeline.addStage({
//       stageName:"build",
//       actions: [
//         new CodeBuildAction({

//           actionName: "CDK_Build",
//           input: cdkSourceOutput,
//           outputs: [cdkBuildOutput],
//           project: new PipelineProject(this, "CdkBuildProject", {
//             environment: {
//               buildImage: LinuxBuildImage.STANDARD_5_0,
//             },
//             buildSpec: BuildSpec.fromSourceFilename(
//               "build-specs/cdk-newman-build-spec.yml"
//             ),
//           }),
          
         
//         }),
//       ]
//     })
    
//     pipeline.addStage({
//       stageName: "Pipeline_Update",
//       actions: [
//         new CloudFormationCreateUpdateStackAction({
//           actionName: "Pipeline_Update",
//           stackName: "AwsCdkTestStack",
//           templatePath: cdkBuildOutput.atPath("AwsCdkTestStack.template.json"),
//           adminPermissions: true,
//         }),
//       ],
      
//     });
   
//   }
// }

import * as cdk from 'aws-cdk-lib';
import { SecretValue, Stage } from 'aws-cdk-lib';
import { BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage, PipelineProject, Project } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, CodeBuildActionType, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as sns from '@aws-cdk/aws-sns';
import { Topic } from "aws-cdk-lib/aws-sns";
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';

export class AwsCdkTestStack extends cdk.Stack {
  private readonly pipelineNotificationsTopic: Topic;
  private readonly buildFailureTopic:Topic;

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
    // pipeline.addStage({
    //   stageName:"build",
    //   actions: [
    //     new CodeBuildAction({

    //       actionName: "CDK_Build",
    //       input: cdkSourceOutput,
    //       outputs: [cdkBuildOutput],
    //       project: new PipelineProject(this, "CdkBuildProject", {
    //         environment: {
    //           buildImage: LinuxBuildImage.STANDARD_5_0,
    //         },
    //         buildSpec: BuildSpec.fromSourceFilename(
    //           "build-specs/cdk-newman-build-spec.yml"
    //         ),
    //       }),
    //     }),
    //   ],
    //   // onFail: new SnsAction({
    //   //       actionName: 'NotifyFailure',
    //   //       topic: snsTopic,
    //   //       message: pipeline.ArtifactPath.fromSourcePath('Build failed')
    //   //     })
    //   new SnsAction({
    //     actionName: "NotifyFailure",
    //     topic: snsTopic,
    //     message: "Build failed",
    //     runOrder: 2,
    //   }),
      
    // })
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
    buildStage.onStateChange(
      "FAILED",
      new SnsTopic(this.pipelineNotificationsTopic, {
        message: RuleTargetInput.fromText(
          `Build Test Failed By Syed. See details here: ${EventField.fromPath(
            "$.detail.execution-result.external-execution-url"
          )}`
        ),
      }),
      {
        ruleName: "Failed",
        eventPattern: {
          detail: {
            state: ["FAILED"],
          },
        },
        description: "Integration test has failed by syed",
      }
    );
    buildStage.onStateChange(
      "Succeeded",
      new SnsTopic(this.pipelineNotificationsTopic, {
        message: RuleTargetInput.fromText(
          `Build Test Failed By Syed. See details here: ${EventField.fromPath(
            "$.detail.execution-result.external-execution-url"
          )}`
        ),
      }),
      {
        ruleName: "SUCCEDED",
        eventPattern: {
          detail: {
            state: ["SUCCEEDED"],
          },
        },
        description: "Integration test has SUCCESS by SURESH",
      }
    );
   

  }
}
//////////////////////////////

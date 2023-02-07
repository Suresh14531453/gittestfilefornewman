 import * as cdk from 'aws-cdk-lib';
 import { Template } from 'aws-cdk-lib/assertions';
 import * as AwsCdkTest from '../lib/aws_cdk_test-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/aws_cdk_test-stack.ts
test('SQS Queue Created', () => {
  const app = new cdk.App();
//     // WHEN
  const stack = new AwsCdkTest.AwsCdkTestStack(app, 'MyTestStack');
//     // THEN
  const template = Template.fromStack(stack);

//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
});

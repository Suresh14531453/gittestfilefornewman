#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkTestStack } from '../lib/aws_cdk_test-stack';

const app = new cdk.App();
new AwsCdkTestStack(app, 'AwsCdkTestStack', {
});
import { CfnSkill } from "@aws-cdk/alexa-ask";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Asset } from "@aws-cdk/aws-s3-assets";
import { App, CfnParameter, Duration, Stack } from "@aws-cdk/core";

const ALEXA_SERVICE_PRINCIPAL = new ServicePrincipal("alexa-appkit.amazon.com");

export class AlexaButSmarterStack extends Stack {
    constructor(app: App, id: string) {
        super(app, id);

        // Infra stack inputs (passed as args when deploying with the CDK CLI)
        // + OpenAI API key used for sending requests to OpenAI from the Lambda function
        // + Login With Amazon (LWA) credentials used for registering a skill on the Alexa console
        const openAiApiKey = new CfnParameter(this, "OpenAiApiKey", { noEcho: true });
        const lwaClientId = new CfnParameter(this, "LwaClientId", { noEcho: true });
        const lwaClientSecret = new CfnParameter(this, "LwaClientSecret", { noEcho: true });
        const lwaRefreshToken = new CfnParameter(this, "LwaRefreshToken", { noEcho: true });
        const lwaVendorId = new CfnParameter(this, "LwaVendorId", { noEcho: true });

        // Lambda function containing the skill business logic
        // + Allow alexa service to access it
        // + Pass OpenAI API key as an environment variable
        const skillLambda = new Function(this, "SkillLambdaFunction", {
            code: Code.fromAsset("../lambda"),
            handler: "index.handler",
            runtime: Runtime.NODEJS_16_X,
            logRetention: 30,
            timeout: Duration.seconds(10),
        });
        skillLambda.grantInvoke(ALEXA_SERVICE_PRINCIPAL);
        skillLambda.addEnvironment("OPENAI_API_KEY", openAiApiKey.valueAsString);

        // Skill package (i.e. skill config). Will be zipped and uploaded to the CDK assets bucket
        // + Role capable of accessing it (assumable by the Allow alexa service)
        // + Give role read permissions
        const skillPkg = new Asset(this, "SkillPkgAsset", { path: "../alexa-skill-package" });
        const skillPkgRole = new Role(this, 'SkillPkgRole', { assumedBy: ALEXA_SERVICE_PRINCIPAL });
        skillPkg.grantRead(skillPkgRole);

        // Actual Alexa skill to be registered on the Alexa console
        const skill = new CfnSkill(this, "Skill", {
            authenticationConfiguration: {
                clientId: lwaClientId.valueAsString,
                clientSecret: lwaClientSecret.valueAsString,
                refreshToken: lwaRefreshToken.valueAsString
            },
            skillPackage: {
                s3BucketRole: skillPkgRole.roleArn,
                s3Bucket: skillPkg.s3BucketName,
                s3Key: skillPkg.s3ObjectKey,
                overrides: {
                    manifest: {
                        apis: {
                            custom: {
                                endpoint: {
                                    uri: skillLambda.functionArn
                                }
                            }
                        }
                    }
                }
            },
            vendorId: lwaVendorId.valueAsString
        });
    }
}

const app = new App();
new AlexaButSmarterStack(app, 'AlexaButSmarter');
app.synth();
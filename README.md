# Alexa but smarter

Simple Alexa skill that proxies conversations between users and a language model (currently OpenAI's GPT-3).

Note that this skill is currently not published, so it can only be used by me.

Here's a demo:

![230980395-0cc28dda-10bf-45f8-b4a7-0f5b0c1e1242](https://user-images.githubusercontent.com/19377340/231246616-67623211-b897-4e2e-b6c0-0e004de354da.gif)

# This repository

This repository contains the following:

- GitHub Actions configuration (see the `.github` directory) used for continuously deploying the infrastructure on new commits.
- AWS CDK configuration (see the `cdk` directory) used for managing the AWS infrastructure via code.
- AWS Lambda function (see the `lambda` directory) containing the business logic implementation.
- Skill package definition (see the `alexa-skill-package` directory) describing the skill configuration.

# Things I'll try next

- Use different language models such as GPT 4 (once it's cheaper) or Google's PaLM (once there's a public API)
- Publish the skill if more people want to try it out

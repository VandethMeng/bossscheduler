import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
  region: env.aws.region,
};

if (env.aws.accessKeyId && env.aws.secretAccessKey) {
  s3Config.credentials = {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  };
}

export const s3Client = new S3Client(s3Config);

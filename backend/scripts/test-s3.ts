/**
 * Test script — verifies S3 read/write access.
 * Run: npm run test:s3
 *
 * Make sure AWS credentials and S3_BUCKET_NAME are set in .env first.
 */
import dotenv from 'dotenv';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET_NAME;
const key = process.env.S3_APPOINTMENTS_KEY || 'appointments.json';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

async function testS3(): Promise<void> {
  if (!bucket || bucket === 'boss-scheduler') {
    console.warn('⚠️  Using default bucket name "boss-scheduler".');
    console.warn('   Update S3_BUCKET_NAME in .env with YOUR actual bucket name.\n');
  }

  if (!accessKeyId || accessKeyId === 'your-aws-access-key-id') {
    console.error('❌ AWS_ACCESS_KEY_ID is not set in backend/.env');
    console.log('   Create an IAM user and access key. See SETUP-GUIDE.md');
    process.exit(1);
  }

  if (!secretAccessKey || secretAccessKey === 'your-aws-secret-access-key') {
    console.error('❌ AWS_SECRET_ACCESS_KEY is not set in backend/.env');
    process.exit(1);
  }

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log(`Testing S3: s3://${bucket}/${key} (region: ${region})\n`);

  // Test read
  console.log('1. Reading appointments.json...');
  try {
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(getCmd);
    const body = await response.Body?.transformToString();
    const data = body ? JSON.parse(body) : [];
    console.log(`   ✅ Read OK — ${Array.isArray(data) ? data.length : 0} appointment(s) found`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('NoSuchKey') || msg.includes('Not Found')) {
      console.log('   ⚠️  File not found — uploading empty appointments.json...');
      const putCmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: '[]',
        ContentType: 'application/json',
      });
      await client.send(putCmd);
      console.log('   ✅ Created empty appointments.json');
    } else {
      console.error('   ❌ Read failed:', msg);
      console.log('\nCommon fixes:');
      console.log('  1. Bucket name in .env must match exactly');
      console.log('  2. IAM user needs s3:GetObject and s3:PutObject on appointments.json');
      console.log('  3. AWS region must match bucket region');
      process.exit(1);
    }
  }

  // Test write
  console.log('2. Testing write access...');
  try {
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(getCmd);
    const body = (await response.Body?.transformToString()) || '[]';
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
    });
    await client.send(putCmd);
    console.log('   ✅ Write OK');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('   ❌ Write failed:', msg);
    process.exit(1);
  }

  console.log('\n✅ S3 is configured correctly!');
}

testS3().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

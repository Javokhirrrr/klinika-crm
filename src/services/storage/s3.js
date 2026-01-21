import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


const s3 = new S3Client({
region: process.env.S3_REGION || 'us-east-1',
endpoint: process.env.S3_ENDPOINT || undefined,
forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
credentials: {
accessKeyId: process.env.S3_KEY,
secretAccessKey: process.env.S3_SECRET,
},
});


export async function uploadBuffer({ bucket, key, buffer, contentType }) {
await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
return { url: `${process.env.S3_ENDPOINT}/${bucket}/${key}` };
}
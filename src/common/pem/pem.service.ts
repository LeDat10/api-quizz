// pem.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PemService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('database.region'),
      credentials: {
        accessKeyId:
          this.configService.get<string>('database.accessKeyId') || '',
        secretAccessKey:
          this.configService.get<string>('database.secretAccessKey') || '',
      },
    });
  }

  async getPem(bucket: string, key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await this.s3.send(command);

    const stream = data.Body as Readable;
    return await new Promise<string>((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }
}

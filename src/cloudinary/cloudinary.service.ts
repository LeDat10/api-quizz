import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import cloudinaryConfig from './config/cloudinary.config';
import { v2 as cloudinary, ResourceType } from 'cloudinary';
@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(cloudinaryConfig.KEY)
    private readonly cloudinaryConfiguration: ConfigType<
      typeof cloudinaryConfig
    >,
  ) {}

  async getUploadSignature(
    folder: string,
    resourceType: ResourceType = 'auto',
  ) {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, resource_type: resourceType },
      this.cloudinaryConfiguration.api_secret as string,
    );

    return {
      timestamp,
      signature,
      cloudName: this.cloudinaryConfiguration.cloud_name,
      apiKey: this.cloudinaryConfiguration.api_key,
      folder,
      resourceType,
    };
  }
}

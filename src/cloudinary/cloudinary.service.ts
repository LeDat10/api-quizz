import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import cloudinaryConfig from './config/cloudinary.config';
import { v2 as cloudinary, ResourceType } from 'cloudinary';
import { UploadSignatureDto } from './dtos/upload-signature.dto';
import { LoggerHelper } from 'src/common/helpers/logger/logger.helper';
import { ErrorHandlerHelper } from 'src/common/helpers/error/handle-error.helper';
import { generateMessage } from 'src/common/utils/generateMessage.util';
import { ResponseFactory } from 'src/common/response/factories/response.factory';
@Injectable()
export class CloudinaryService {
  private readonly logger = new LoggerHelper(CloudinaryService.name);
  private readonly errorHandler = new ErrorHandlerHelper(
    CloudinaryService.name,
  );

  private _entity = 'Category';
  constructor(
    @Inject(cloudinaryConfig.KEY)
    private readonly cloudinaryConfiguration: ConfigType<
      typeof cloudinaryConfig
    >,
  ) {
    cloudinary.config({
      cloud_name: this.cloudinaryConfiguration.cloud_name,
      api_key: this.cloudinaryConfiguration.api_key,
      api_secret: this.cloudinaryConfiguration.api_secret,
    });
  }

  async getUploadSignature(uploadSignatureDto: UploadSignatureDto) {
    const ctx = { method: 'getUploadSignature', entity: this._entity };
    this.logger.start(ctx);
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);

      if (!uploadSignatureDto.resourceType) {
        uploadSignatureDto.resourceType = 'auto';
      }

      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder: uploadSignatureDto.folder,
        },
        this.cloudinaryConfiguration.api_secret as string,
      );

      this.logger.success(ctx, 'fetched');
      return {
        timestamp,
        signature,
        cloudName: this.cloudinaryConfiguration.cloud_name,
        apiKey: this.cloudinaryConfiguration.api_key,
        folder: uploadSignatureDto.folder,
        resourceType: uploadSignatureDto.resourceType,
      };
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity);
    }
  }

  async deleteFile(publicId: string, resourceType: ResourceType) {
    const ctx = { method: 'deleteFile', entity: this._entity, publicId };
    this.logger.start(ctx);
    try {
      if (!publicId) {
        const reason = 'Missing parameter publicId';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, publicId, reason),
        );
      }

      if (!resourceType) {
        const reason = 'Missing parameter resourceType';
        this.logger.warn(ctx, 'failed', reason);
        throw new BadRequestException(
          generateMessage('failed', this._entity, publicId, reason),
        );
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      if (result.result === 'ok') {
        return ResponseFactory.success('File deleted successfully', result);
      } else if (result.result === 'not found') {
        const reason = 'File not found in Cloudinary';
        this.logger.fail(ctx, reason, 'deleted');
        throw new NotFoundException(
          generateMessage('failed', this._entity, publicId, reason),
        );
      } else {
        this.logger.fail(ctx, undefined, 'deleted');
        throw new Error(`Delete failed: ${result.result}`);
      }
    } catch (error) {
      return this.errorHandler.handle(ctx, error, this._entity, publicId);
    }
  }

  // // Delete multiple files at once
  // async deleteFiles(publicIds: string[], resourceType: ResourceType = 'image') {
  //   try {
  //     console.log(`Deleting ${publicIds.length} files from Cloudinary`);

  //     const result = await cloudinary.api.delete_resources(publicIds, {
  //       resource_type: resourceType,
  //       invalidate: true,
  //     });

  //     console.log('Bulk delete result:', result);

  //     return {
  //       success: true,
  //       deleted: result.deleted,
  //       deleted_counts: result.deleted_counts,
  //       partial: result.partial,
  //     };
  //   } catch (error) {
  //     console.error('Error bulk deleting files:', error);
  //     throw new Error(
  //       `Failed to delete files: ${error.message || 'Unknown error'}`,
  //     );
  //   }
  // }

  // // Delete all files in a folder
  // async deleteByPrefix(prefix: string, resourceType: ResourceType = 'image') {
  //   try {
  //     console.log(`Deleting files with prefix: ${prefix}`);

  //     const result = await cloudinary.api.delete_resources_by_prefix(prefix, {
  //       resource_type: resourceType,
  //       invalidate: true,
  //     });

  //     console.log('Delete by prefix result:', result);

  //     return {
  //       success: true,
  //       deleted_counts: result.deleted_counts,
  //     };
  //   } catch (error) {
  //     console.error('Error deleting by prefix:', error);
  //     throw new Error(
  //       `Failed to delete by prefix: ${error.message || 'Unknown error'}`,
  //     );
  //   }
  // }

  // // Delete folder (must be empty)
  // async deleteFolder(folderPath: string) {
  //   try {
  //     console.log(`Deleting folder: ${folderPath}`);

  //     const result = await cloudinary.api.delete_folder(folderPath);

  //     console.log('Folder delete result:', result);

  //     return {
  //       success: true,
  //       message: 'Folder deleted successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error deleting folder:', error);
  //     throw new Error(
  //       `Failed to delete folder: ${error.message || 'Unknown error'}`,
  //     );
  //   }
  // }
}

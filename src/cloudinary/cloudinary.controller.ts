import { Body, Controller, Delete, Param, Post, Query } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadSignatureDto } from './dtos/upload-signature.dto';
import { ResourceType } from 'cloudinary';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryServie: CloudinaryService) {}

  @Post('signature')
  @ApiOperation({
    summary: 'Generate upload signature for direct Cloudinary upload',
    description:
      'This endpoint returns a timestamp and signature used for secure direct uploads to Cloudinary.',
  })
  @ApiBody({
    description: 'Payload required to generate the upload signature',
    type: UploadSignatureDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Upload signature generated successfully',
    schema: {
      example: {
        timestamp: 1700000000,
        signature: 'abcd1234xyzsignature',
        cloudName: 'your-cloud-name',
        apiKey: '1234567890',
        folder: 'products',
        resourceType: 'image',
      },
    },
  })
  public async GetUploadSignature(
    @Body() uploadSignatureDto: UploadSignatureDto,
  ) {
    return this.cloudinaryServie.getUploadSignature(uploadSignatureDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete a file from Cloudinary',
    description:
      'Deletes a file from Cloudinary using its publicId. Supports image, video, raw, and auto resource types.',
  })
  @ApiQuery({
    name: 'publicId',
    required: true,
    description: 'Public ID of the Cloudinary asset to delete',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    description: 'Type of Cloudinary resource',
    enum: ['image', 'video', 'raw', 'auto'],
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        status: 'success',
        message: 'File deleted successfully',
        data: {
          result: 'ok',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'File not found on Cloudinary',
    schema: {
      example: {
        status: 'error',
        message: 'Failed: File not found in Cloudinary',
      },
    },
  })
  async deleteFile(
    @Query('publicId') publicId: string,
    @Query('resourceType') resourceType: ResourceType,
  ) {
    return await this.cloudinaryServie.deleteFile(publicId, resourceType);
  }
}

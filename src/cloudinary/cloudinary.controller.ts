import { Body, Controller, Post } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryServie: CloudinaryService) {}

  @Post('signature')
  public async GetUploadSignature(@Body() folder: string) {
    return this.cloudinaryServie.getUploadSignature(folder);
  }
}

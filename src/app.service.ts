import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  landingPageService(): string {
    const indexHtmlPath = path.join(process.cwd(), 'src', 'index.html');

    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      return html;
    } catch (error) {
      throw new HttpException(
        'index.html not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  privaryPageService(): string {
    const indexHtmlPath = path.join(process.cwd(), 'src', 'privacy.html');

    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      return html;
    } catch (error) {
      throw new HttpException(
        'Page not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  termsPageService(): string {
    const indexHtmlPath = path.join(process.cwd(), 'src', 'terms.html');

    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      return html;
    } catch (error) {
      throw new HttpException(
        'Page not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

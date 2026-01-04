import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './better-auth.config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Better Auth')
@Controller('auth')
export class BetterAuthController {
  @All('*')
  @ApiOperation({ 
    summary: 'Handle Better Auth requests',
    description: 'Proxy all auth requests to Better Auth handler'
  })
  @ApiResponse({ status: 200, description: 'Auth operation successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Convert Express request to Web API Request
    const url = new URL(req.url, `${req.protocol}://${req.get('host')}`);
    const webRequest = new globalThis.Request(url.toString(), {
      method: req.method,
      headers: req.headers as any,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    try {
      const response = await auth.handler(webRequest);
      
      // Convert Web API Response to Express response
      const body = await response.text();
      res.status(response.status);
      
      // Set headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      return res.send(body);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
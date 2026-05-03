import pino from 'pino';
import { sharedEngineState } from './engineState';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.Authorization', '*.privateKey', '*.pimlicoApiKey'],
    censor: ''
  },
  // BSS-WhiteLabel: Stealth Log Sanitizer
  formatters: {
    log(object: any) {
      const replacement = sharedEngineState.appName || (sharedEngineState.ghostMode ? 'Elite Protocol' : 'allbright');
      
      if (object.msg && typeof object.msg === 'string') {
        object.msg = object.msg.replace(/allbright/gi, replacement);
      }
      return object;
    }
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
});

export { logger };

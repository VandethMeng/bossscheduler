import app from './app';
import { env } from './config/env';
import { authService } from './services/AuthService';

const startServer = async (): Promise<void> => {
  try {
    await authService.initialize();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

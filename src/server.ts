import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.port, () => {
  console.log(
    `[stellar-payment-backend] Server listening on port ${env.port} (${env.stellarNetwork})`
  );
});

export default server;

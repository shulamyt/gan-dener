import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './lib';
import { env } from './config';
import {
  TenantRepository,
  ChildRepository,
  PaymentRepository,
  BalanceRepository,
} from './repositories';
import { MessageParser } from './parsers';
import { TenantService, ChildService, PaymentService, MessageHandlerService } from './services';
import { TwilioWhatsAppClient, GoogleSheetsIntegration } from './integrations';
import { WebhookController, HealthController } from './controllers';

export interface AppContainer {
  prisma: PrismaClient;
  sheetsIntegration: GoogleSheetsIntegration | null;
  messageHandler: MessageHandlerService;
  webhookController: WebhookController;
  healthController: HealthController;
}

export function createContainer(): AppContainer {
  const prisma = getPrismaClient();

  const tenantRepo = new TenantRepository(prisma);
  const childRepo = new ChildRepository(prisma);
  const paymentRepo = new PaymentRepository(prisma);
  const balanceRepo = new BalanceRepository(prisma);

  const parser = new MessageParser();

  const tenantService = new TenantService(tenantRepo);
  const childService = new ChildService(childRepo);
  const paymentService = new PaymentService(prisma, paymentRepo, balanceRepo);

  const whatsappClient = new TwilioWhatsAppClient(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_AUTH_TOKEN,
    env.TWILIO_WHATSAPP_NUMBER,
  );

  let sheetsIntegration: GoogleSheetsIntegration | null = null;
  if (env.GOOGLE_SHEETS_CREDENTIALS_PATH && env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID) {
    sheetsIntegration = new GoogleSheetsIntegration(
      env.GOOGLE_SHEETS_CREDENTIALS_PATH,
      env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID,
    );
  }

  const messageHandler = new MessageHandlerService(
    parser,
    tenantService,
    childService,
    paymentService,
    whatsappClient,
    sheetsIntegration,
  );

  const webhookController = new WebhookController(messageHandler);
  const healthController = new HealthController();

  return {
    prisma,
    sheetsIntegration,
    messageHandler,
    webhookController,
    healthController,
  };
}

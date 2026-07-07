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
import { WhatsAppClient, GoogleSheetsIntegration } from './integrations';
import { WebhookController, HealthController } from './controllers';

export interface AppContainer {
  prisma: PrismaClient;
  whatsappClient: WhatsAppClient;
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

  const whatsappClient = new WhatsAppClient(
    env.WHATSAPP_API_URL,
    env.WHATSAPP_PHONE_NUMBER_ID,
    env.WHATSAPP_ACCESS_TOKEN,
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

  const webhookController = new WebhookController(messageHandler, whatsappClient);
  const healthController = new HealthController();

  return {
    prisma,
    whatsappClient,
    sheetsIntegration,
    messageHandler,
    webhookController,
    healthController,
  };
}

import { PrismaClient } from '@prisma/client';
import { getPrismaClient, logger } from './lib';
import { env } from './config';
import {
  TenantRepository,
  FamilyRepository,
  PaymentRepository,
  BalanceRepository,
  BalanceHistoryRepository,
  ChildRepository,
} from './repositories';
import { MessageParser } from './parsers';
import { TenantService, FamilyService, PaymentService, MessageHandlerService } from './services';
import { TwilioWhatsAppClient, GoogleSheetsIntegration } from './integrations';
import { WebhookController, HealthController, BalanceHistoryController } from './controllers';

export interface AppContainer {
  prisma: PrismaClient;
  sheetsIntegration: GoogleSheetsIntegration | null;
  messageHandler: MessageHandlerService;
  webhookController: WebhookController;
  healthController: HealthController;
  balanceHistoryController: BalanceHistoryController;
  familyRepository: FamilyRepository;
  childRepository: ChildRepository;
  paymentRepository: PaymentRepository;
}

export function createContainer(): AppContainer {
  const prisma = getPrismaClient();

  const tenantRepo = new TenantRepository(prisma);
  const familyRepo = new FamilyRepository(prisma);
  const childRepo = new ChildRepository(prisma);
  const paymentRepo = new PaymentRepository(prisma);
  const balanceRepo = new BalanceRepository(prisma);
  const balanceHistoryRepo = new BalanceHistoryRepository(prisma);

  const parser = new MessageParser();

  const tenantService = new TenantService(tenantRepo);
  const familyService = new FamilyService(familyRepo);
  const paymentService = new PaymentService(prisma, paymentRepo, balanceRepo, balanceHistoryRepo);

  const whatsappClient = new TwilioWhatsAppClient(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_AUTH_TOKEN,
    env.TWILIO_WHATSAPP_NUMBER,
  );

  // Log WhatsApp configuration (without sensitive data)
  logger.info('📱 WhatsApp client configured', {
    accountSid: `${env.TWILIO_ACCOUNT_SID.substring(0, 8)}...${env.TWILIO_ACCOUNT_SID.slice(-4)}`,
    whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
    hasAuthToken: !!env.TWILIO_AUTH_TOKEN,
  });

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
    familyService,
    paymentService,
    whatsappClient,
    sheetsIntegration,
  );

  const webhookController = new WebhookController(messageHandler);
  const healthController = new HealthController();
  const balanceHistoryController = new BalanceHistoryController(paymentService);

  return {
    prisma,
    sheetsIntegration,
    messageHandler,
    webhookController,
    healthController,
    balanceHistoryController,
    familyRepository: familyRepo,
    childRepository: childRepo,
    paymentRepository: paymentRepo,
  };
}

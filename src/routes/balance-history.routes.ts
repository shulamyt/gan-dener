import { Router } from 'express';
import { BalanceHistoryController } from '../controllers';

export function createBalanceHistoryRouter(controller: BalanceHistoryController): Router {
  const router = Router();

  // GET /api/balance-history/:tenantId - Get balance history for a tenant
  router.get('/:tenantId', (req, res) => {
    controller.getTenantBalanceHistory(req, res);
  });

  // GET /api/balance-history/:tenantId/stats - Get balance statistics for a tenant
  router.get('/:tenantId/stats', (req, res) => {
    controller.getTenantBalanceStats(req, res);
  });

  // GET /api/balance-history/:tenantId/family/:familyId - Get balance history for a specific family
  router.get('/:tenantId/family/:familyId', (req, res) => {
    controller.getFamilyBalanceHistory(req, res);
  });

  // GET /api/balance-history/:tenantId/family/:familyId/stats - Get balance statistics for a specific family
  router.get('/:tenantId/family/:familyId/stats', (req, res) => {
    controller.getFamilyBalanceStats(req, res);
  });

  return router;
}

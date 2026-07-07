import { Request, Response } from 'express';
import { PaymentService } from '../services';
import { logger } from '../lib';

// Utility function to safely extract string from query parameters
function extractQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

export class BalanceHistoryController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * GET /api/balance-history/:tenantId
   * Get balance history for a tenant
   */
  async getTenantBalanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = extractQueryString(req.params.tenantId)!;
      const { limit, offset, from, to } = req.query;

      const limitStr = extractQueryString(limit) || '50';
      const offsetStr = extractQueryString(offset) || '0';
      const fromStr = extractQueryString(from);
      const toStr = extractQueryString(to);

      const options = {
        limit: parseInt(limitStr, 10),
        offset: parseInt(offsetStr, 10),
        from: fromStr ? new Date(fromStr) : undefined,
        to: toStr ? new Date(toStr) : undefined,
      };

      const history = await this.paymentService.getTenantBalanceHistory(tenantId, options);
      const stats = await this.paymentService.getTenantBalanceStats(
        tenantId,
        options.from,
        options.to,
      );

      res.json({
        success: true,
        data: {
          history,
          stats,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: stats.totalChanges,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching tenant balance history', {
        tenantId: req.params.tenantId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch balance history',
      });
    }
  }

  /**
   * GET /api/balance-history/:tenantId/family/:familyId
   * Get balance history for a specific family
   */
  async getFamilyBalanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const familyId = extractQueryString(req.params.familyId)!;
      const { limit, offset, from, to } = req.query;

      const limitStr = extractQueryString(limit) || '50';
      const offsetStr = extractQueryString(offset) || '0';
      const fromStr = extractQueryString(from);
      const toStr = extractQueryString(to);

      const options = {
        limit: parseInt(limitStr, 10),
        offset: parseInt(offsetStr, 10),
        from: fromStr ? new Date(fromStr) : undefined,
        to: toStr ? new Date(toStr) : undefined,
      };

      const [history, stats] = await Promise.all([
        this.paymentService.getFamilyBalanceHistory(familyId, options),
        this.paymentService.getFamilyBalanceStats(familyId, options.from, options.to),
      ]);

      res.json({
        success: true,
        data: {
          history,
          stats,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: stats.totalChanges,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching family balance history', {
        familyId: req.params.familyId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch family balance history',
      });
    }
  }

  /**
   * GET /api/balance-history/:tenantId/stats
   * Get balance history statistics for a tenant
   */
  async getTenantBalanceStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = extractQueryString(req.params.tenantId)!;
      const { from, to } = req.query;

      const fromStr = extractQueryString(from);
      const toStr = extractQueryString(to);

      const stats = await this.paymentService.getTenantBalanceStats(
        tenantId,
        fromStr ? new Date(fromStr) : undefined,
        toStr ? new Date(toStr) : undefined,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching tenant balance stats', {
        tenantId: req.params.tenantId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch balance statistics',
      });
    }
  }

  /**
   * GET /api/balance-history/:tenantId/family/:familyId/stats
   * Get balance history statistics for a specific family
   */
  async getFamilyBalanceStats(req: Request, res: Response): Promise<void> {
    try {
      const familyId = extractQueryString(req.params.familyId)!;
      const { from, to } = req.query;

      const fromStr = extractQueryString(from);
      const toStr = extractQueryString(to);

      const stats = await this.paymentService.getFamilyBalanceStats(
        familyId,
        fromStr ? new Date(fromStr) : undefined,
        toStr ? new Date(toStr) : undefined,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching family balance stats', {
        familyId: req.params.familyId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch family balance statistics',
      });
    }
  }
}

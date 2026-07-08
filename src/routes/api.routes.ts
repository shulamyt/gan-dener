import { Router } from 'express';
import type { AppContainer } from '../container';

export function createApiRouter(container: AppContainer): Router {
  const router = Router();

  // Dashboard endpoint
  router.get('/dashboard/stats', async (_, res) => {
    try {
      const familyRepository = container.familyRepository;
      const childRepository = container.childRepository;
      const paymentRepository = container.paymentRepository;

      // Get basic stats
      const families = await familyRepository.findAll();
      const children = await childRepository.findAll();

      // Get recent payments (last 10)
      const recentPayments = await paymentRepository.findAll({
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Calculate stats
      const totalFamilies = families.length;
      const totalChildren = children.length;
      // For demo purposes since balance is not in family model currently
      const totalBalance = 0;
      
      // For demo purposes, we'll simulate today's payments
      const todayPayments = Math.floor(Math.random() * 5);
      const todayAmount = Math.floor(Math.random() * 1000);

      const stats = {
        totalFamilies,
        totalChildren,
        totalBalance,
        todayPayments,
        todayAmount,
        recentPayments: recentPayments.map((payment: any) => ({
          ...payment,
          amount: payment.amount.toNumber(), // Convert Decimal to number
          child: { name: payment.paidFor || 'Unknown' } // Use paidFor field
        }))
      };

      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch dashboard stats',
        data: null 
      });
    }
  });

  // Families endpoints
  router.get('/families', async (_, res) => {
    try {
      const families = await container.familyRepository.findAll();
      return res.json({ success: true, data: families });
    } catch (error) {
      console.error('Get families error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch families', data: null });
    }
  });

  router.get('/families/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const family = await container.familyRepository.findById(id);
      
      if (!family) {
        return res.status(404).json({ success: false, message: 'Family not found', data: null });
      }

      // Get children for this family
      const children = await container.childRepository.findByFamilyId(id);
      
      return res.json({ 
        success: true, 
        data: { 
          ...family, 
          children 
        } 
      });
    } catch (error) {
      console.error('Get family error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch family', data: null });
    }
  });

  router.post('/families', async (req, res) => {
    try {
      const { lastName, tenantId } = req.body;
      
      if (!lastName) {
        return res.status(400).json({ success: false, message: 'Family last name is required', data: null });
      }

      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required', data: null });
      }

      const family = await container.familyRepository.create({
        lastName,
        tenantId
      });

      return res.status(201).json({ success: true, data: family });
    } catch (error) {
      console.error('Create family error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create family', data: null });
    }
  });

  // Children endpoints
  router.get('/children', async (_, res) => {
    try {
      const children = await container.childRepository.findAll();
      return res.json({ success: true, data: children });
    } catch (error) {
      console.error('Get children error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch children', data: null });
    }
  });

  router.post('/children', async (req, res) => {
    try {
      const { firstName, familyId, gardenName } = req.body;
      
      if (!firstName || !familyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Child first name and family ID are required', 
          data: null 
        });
      }

      const child = await container.childRepository.create({
        firstName,
        familyId,
        gardenName
      });

      return res.status(201).json({ success: true, data: child });
    } catch (error) {
      console.error('Create child error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create child', data: null });
    }
  });

  // Payments endpoints
  router.get('/payments', async (req, res) => {
    try {
      const { familyId, limit = 50, offset = 0 } = req.query;
      
      const payments = await container.paymentRepository.findAll({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Filter by familyId if provided
      let filteredPayments = payments;
      if (familyId) {
        filteredPayments = payments.filter(p => p.familyId === familyId);
      }

      // Convert payments to expected format
      const formattedPayments = filteredPayments.map((payment: any) => ({
        ...payment,
        amount: payment.amount.toNumber(), // Convert Decimal to number
        child: { name: payment.paidFor || 'Unknown' } // Use paidFor field as child name
      }));

      return res.json({ success: true, data: formattedPayments });
    } catch (error) {
      console.error('Get payments error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch payments', data: null });
    }
  });

  router.post('/payments', async (req, res) => {
    try {
      const { familyId, amount, paymentMethod, notes, paidFor, tenantId } = req.body;
      
      if (!familyId || !amount || !paymentMethod || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Family ID, amount, payment method, and tenant ID are required', 
          data: null 
        });
      }

      const payment = await container.paymentRepository.create({
        familyId,
        amount: parseFloat(amount),
        paymentMethod,
        notes,
        paidFor,
        tenantId
      });

      return res.status(201).json({ 
        success: true, 
        data: {
          ...payment,
          amount: payment.amount.toNumber() // Convert Decimal to number
        }
      });
    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create payment', data: null });
    }
  });

  return router;
}
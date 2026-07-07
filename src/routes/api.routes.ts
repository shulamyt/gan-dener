import { Router } from 'express';
import type { AppContainer } from '../container';

export function createApiRouter(container: AppContainer): Router {
  const router = Router();

  // Dashboard endpoint
  router.get('/dashboard/stats', async (req, res) => {
    try {
      const familyRepository = container.familyRepository;
      const childRepository = container.childRepository;
      const paymentRepository = container.paymentRepository;

      // Get basic stats
      const families = await familyRepository.findAll();
      const children = await childRepository.findAll();
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get recent payments (last 10)
      const recentPayments = await paymentRepository.findAll({
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // Calculate stats
      const totalFamilies = families.length;
      const totalChildren = children.length;
      const totalBalance = families.reduce((sum, family) => sum + family.balance, 0);
      
      // For demo purposes, we'll simulate today's payments
      const todayPayments = Math.floor(Math.random() * 5);
      const todayAmount = Math.floor(Math.random() * 1000);

      const stats = {
        totalFamilies,
        totalChildren,
        totalBalance,
        todayPayments,
        todayAmount,
        recentPayments: recentPayments.map(payment => ({
          ...payment,
          child: { name: `Child ${payment.child_id}` } // Simplified for demo
        }))
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch dashboard stats',
        data: null 
      });
    }
  });

  // Families endpoints
  router.get('/families', async (req, res) => {
    try {
      const families = await container.familyRepository.findAll();
      res.json({ success: true, data: families });
    } catch (error) {
      console.error('Get families error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch families', data: null });
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
      
      res.json({ 
        success: true, 
        data: { 
          ...family, 
          children 
        } 
      });
    } catch (error) {
      console.error('Get family error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch family', data: null });
    }
  });

  router.post('/families', async (req, res) => {
    try {
      const { name, balance = 0, parentPhoneNumber } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Family name is required', data: null });
      }

      const family = await container.familyRepository.create({
        name,
        balance: balance || 0,
        parent_phone_number: parentPhoneNumber
      });

      res.status(201).json({ success: true, data: family });
    } catch (error) {
      console.error('Create family error:', error);
      res.status(500).json({ success: false, message: 'Failed to create family', data: null });
    }
  });

  // Children endpoints
  router.get('/children', async (req, res) => {
    try {
      const children = await container.childRepository.findAll();
      res.json({ success: true, data: children });
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch children', data: null });
    }
  });

  router.post('/children', async (req, res) => {
    try {
      const { name, familyId } = req.body;
      
      if (!name || !familyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Child name and family ID are required', 
          data: null 
        });
      }

      const child = await container.childRepository.create({
        name,
        family_id: familyId
      });

      res.status(201).json({ success: true, data: child });
    } catch (error) {
      console.error('Create child error:', error);
      res.status(500).json({ success: false, message: 'Failed to create child', data: null });
    }
  });

  // Payments endpoints
  router.get('/payments', async (req, res) => {
    try {
      const { familyId, childId, limit = 50, offset = 0 } = req.query;
      
      const payments = await container.paymentRepository.findAll({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      // Add child info to payments
      const paymentsWithChildren = await Promise.all(
        payments.map(async (payment) => {
          const child = await container.childRepository.findById(payment.child_id);
          return {
            ...payment,
            child: child ? { id: child.id, name: child.name, familyId: child.family_id } : null
          };
        })
      );

      // Filter by familyId or childId if provided
      let filteredPayments = paymentsWithChildren;
      if (familyId) {
        filteredPayments = filteredPayments.filter(p => p.child?.familyId === familyId);
      }
      if (childId) {
        filteredPayments = filteredPayments.filter(p => p.child_id === childId);
      }

      res.json({ success: true, data: filteredPayments });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments', data: null });
    }
  });

  router.post('/payments', async (req, res) => {
    try {
      const { childId, amount, paymentMethod, notes } = req.body;
      
      if (!childId || !amount || !paymentMethod) {
        return res.status(400).json({ 
          success: false, 
          message: 'Child ID, amount, and payment method are required', 
          data: null 
        });
      }

      const payment = await container.paymentRepository.create({
        child_id: childId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes
      });

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to create payment', data: null });
    }
  });

  return router;
}
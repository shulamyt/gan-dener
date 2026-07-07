export interface Child {
  id: string;
  name: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  balance: number;
  parentPhoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  children?: Child[];
}

export interface Parent {
  id: string;
  phoneNumber: string;
  name?: string;
  familyId?: string;
  createdAt: string;
  updatedAt: string;
  family?: Family;
}

export interface Payment {
  id: string;
  childId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  child?: Child;
}

export interface BalanceHistory {
  id: string;
  familyId: string;
  oldBalance: number;
  newBalance: number;
  changeAmount: number;
  changeType: 'PAYMENT' | 'BALANCE_SET' | 'ADJUSTMENT';
  paymentId?: string;
  notes?: string;
  createdAt: string;
  family?: Family;
  payment?: Payment;
}

export interface DashboardStats {
  totalFamilies: number;
  totalChildren: number;
  totalBalance: number;
  todayPayments: number;
  todayAmount: number;
  recentPayments: Payment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export enum PaymentMethodLabel {
  CASH = 'cash',
  BIT = 'bit',
  BANK_TRANSFER = 'bank transfer',
  CREDIT_CARD = 'credit card',
  CHECK = 'check',
  OTHER = 'other',
}
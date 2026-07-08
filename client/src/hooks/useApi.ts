import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  familyApi, 
  childApi, 
  paymentApi, 
  balanceHistoryApi, 
  dashboardApi 
} from '../services/api'
import type { Family, Child, Payment } from '../types'

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then(res => res.data.data)
  })
}

// Family hooks
export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: () => familyApi.getAll().then(res => res.data.data)
  })
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: ['families', id],
    queryFn: () => familyApi.getById(id).then(res => res.data.data),
    enabled: !!id
  })
}

export function useFamilyBalanceHistory(familyId: string) {
  return useQuery({
    queryKey: ['families', familyId, 'balance-history'],
    queryFn: () => familyApi.getBalanceHistory(familyId).then(res => res.data.data),
    enabled: !!familyId
  })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Family>) => familyApi.create(data).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Family> }) =>
      familyApi.update(id, data).then(res => res.data.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['families', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

// Children hooks
export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => childApi.getAll().then(res => res.data.data)
  })
}

export function useCreateChild() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Child>) => childApi.create(data).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

// Payment hooks
export function usePayments(params?: { familyId?: string; childId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentApi.getAll(params).then(res => res.data.data)
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Payment>) => paymentApi.create(data).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['balance-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

// Balance History hooks
export function useBalanceHistory(params?: { familyId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['balance-history', params],
    queryFn: () => balanceHistoryApi.getAll(params).then(res => res.data.data)
  })
}
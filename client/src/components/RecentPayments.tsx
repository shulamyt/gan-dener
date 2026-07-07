import { format } from 'date-fns'
import { CreditCard } from 'lucide-react'
import type { Payment } from '../types'

interface RecentPaymentsProps {
  payments: Payment[]
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No recent payments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
      <div className="space-y-4">
        {payments.slice(0, 10).map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {payment.child?.name || 'Unknown Child'}
                </p>
                <p className="text-sm text-gray-500">
                  {payment.paymentMethod} • {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">₪{payment.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
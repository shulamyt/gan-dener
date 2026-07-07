import { usePayments } from '../hooks/useApi'
import { format } from 'date-fns'
import { CreditCard, ArrowUpRight } from 'lucide-react'
import type { Payment } from '../types'

interface PaymentHistoryProps {
  familyId: string
}

export function PaymentHistory({ familyId }: PaymentHistoryProps) {
  const { data: payments, isLoading, error } = usePayments({ familyId, limit: 20 })

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        <div className="text-center py-6 text-red-600">
          Failed to load payment history
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        {payments && payments.length > 0 && (
          <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {!payments || payments.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentItem({ payment }: { payment: Payment }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {payment.child?.name || 'Unknown Child'}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{payment.paymentMethod}</span>
            <span>•</span>
            <span>{format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          {payment.notes && (
            <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-green-600">₪{payment.amount.toLocaleString()}</p>
      </div>
    </div>
  )
}
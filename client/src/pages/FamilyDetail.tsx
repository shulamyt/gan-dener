import { useParams, Link } from 'react-router-dom'
import { useFamily, useFamilyBalanceHistory } from '../hooks/useApi'
import { BalanceChart } from '../components/BalanceChart'
import { ChildrenList } from '../components/ChildrenList'
import { PaymentHistory } from '../components/PaymentHistory'
import { 
  ArrowLeft, 
  Phone, 
  DollarSign, 
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react'

export function FamilyDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: family, isLoading: familyLoading, error: familyError } = useFamily(id!)
  const { data: balanceHistory, isLoading: historyLoading } = useFamilyBalanceHistory(id!)

  if (familyLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card h-64 animate-pulse"></div>
            <div className="card h-48 animate-pulse"></div>
          </div>
          <div className="card h-64 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (familyError || !family) {
    return (
      <div className="space-y-6">
        <Link to="/families" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Families</span>
        </Link>
        <div className="card">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Family not found or failed to load.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/families" 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{family.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              {family.parentPhoneNumber && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{family.parentPhoneNumber}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{family.children?.length || 0} children</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h2>
            <p className={`text-3xl font-bold ${
              family.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₪{family.balance.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-primary-100 rounded-full">
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Chart */}
          {!historyLoading && balanceHistory && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Balance History</h3>
              </div>
              <BalanceChart data={balanceHistory} />
            </div>
          )}

          {/* Payment History */}
          <PaymentHistory familyId={family.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Children List */}
          <ChildrenList familyId={family.id} children={family.children || []} />

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary text-left">
                Record Payment
              </button>
              <button className="w-full btn-secondary text-left">
                Adjust Balance
              </button>
              <button className="w-full btn-secondary text-left">
                Add Child
              </button>
              <button className="w-full btn-secondary text-left">
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
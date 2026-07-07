import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFamilies, useCreateFamily } from '../hooks/useApi'
import { FamilyForm } from '../components/FamilyForm'
import { 
  Plus, 
  Users, 
  DollarSign, 
  Eye,
  AlertCircle,
  Search
} from 'lucide-react'
import type { Family } from '../types'

export function Families() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { data: families, isLoading, error } = useFamilies()
  const createFamily = useCreateFamily()

  const handleCreateFamily = async (data: Partial<Family>) => {
    try {
      await createFamily.mutateAsync(data)
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create family:', error)
    }
  }

  const filteredFamilies = families?.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.parentPhoneNumber?.includes(searchTerm)
  ) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Families</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Families</h1>
        <div className="card">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load families. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Families</h1>
          <p className="text-gray-600">Manage families and their account balances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Family</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search families..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Families Grid */}
      {filteredFamilies.length === 0 ? (
        <div className="card">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No families found matching your search' : 'No families yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 btn-primary"
              >
                Add Your First Family
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFamilies.map((family) => (
            <div key={family.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {family.name}
                  </h3>
                  {family.parentPhoneNumber && (
                    <p className="text-sm text-gray-600">{family.parentPhoneNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    family.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₪{family.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{family.children?.length || 0} children</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Balance</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to={`/families/${family.id}`}
                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Family Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Family</h2>
              <FamilyForm
                onSubmit={handleCreateFamily}
                onCancel={() => setShowForm(false)}
                isLoading={createFamily.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
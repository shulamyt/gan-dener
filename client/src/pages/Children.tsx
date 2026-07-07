import { useState } from 'react'
import { useChildren, useCreateChild, useFamilies } from '../hooks/useApi'
import { format } from 'date-fns'
import { 
  Baby, 
  Plus, 
  Search, 
  Users,
  AlertCircle
} from 'lucide-react'

export function Children() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const { data: children, isLoading, error } = useChildren()
  const { data: families } = useFamilies()
  const createChild = useCreateChild()

  const filteredChildren = children?.filter(child => {
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFamily = !selectedFamily || child.familyId === selectedFamily
    return matchesSearch && matchesFamily
  }) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Children</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Children</h1>
        <div className="card">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load children. Please try again.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Children</h1>
          <p className="text-gray-600">Manage children enrolled in the kindergarten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Child</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search children..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Families</option>
            {families?.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Children</p>
          <p className="text-2xl font-bold text-gray-900">{filteredChildren.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Active Families</p>
          <p className="text-2xl font-bold text-blue-600">
            {new Set(filteredChildren.map(c => c.familyId)).size}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Enrolled Today</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredChildren.filter(c => 
              new Date(c.createdAt).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      {/* Children Grid */}
      {filteredChildren.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedFamily ? 'No children found matching your filters' : 'No children enrolled yet'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add First Child
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => {
            const family = families?.find(f => f.id === child.familyId)
            return (
              <div key={child.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Baby className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-600">{family?.name || 'Unknown Family'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Family Balance: {family ? `₪${family.balance.toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enrolled: {format(new Date(child.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full btn-secondary text-sm">
                    View Payments
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Child Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Child</h2>
              <ChildForm
                families={families || []}
                onSubmit={async (data) => {
                  await createChild.mutateAsync(data)
                  setShowForm(false)
                }}
                onCancel={() => setShowForm(false)}
                isLoading={createChild.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChildForm({ families, onSubmit, onCancel, isLoading }: {
  families: any[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    familyId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Child Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter child's name"
        />
      </div>

      <div>
        <label htmlFor="familyId" className="block text-sm font-medium text-gray-700 mb-1">
          Family *
        </label>
        <select
          id="familyId"
          required
          value={formData.familyId}
          onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a family</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding...' : 'Add Child'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
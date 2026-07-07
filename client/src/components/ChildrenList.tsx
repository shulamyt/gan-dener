import { useState } from 'react'
import { useCreateChild } from '../hooks/useApi'
import { Baby, Plus } from 'lucide-react'
import type { Child } from '../types'

interface ChildrenListProps {
  familyId: string
  children: Child[]
}

export function ChildrenList({ familyId, children }: ChildrenListProps) {
  const [showForm, setShowForm] = useState(false)
  const [childName, setChildName] = useState('')
  const createChild = useCreateChild()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!childName.trim()) return

    try {
      await createChild.mutateAsync({
        name: childName.trim(),
        familyId
      })
      setChildName('')
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create child:', error)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Children</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add Child</span>
        </button>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-6">
          <Baby className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No children added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {children.map((child) => (
            <div key={child.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Baby className="h-4 w-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{child.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Child Form */}
      {showForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                Child Name
              </label>
              <input
                type="text"
                id="childName"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter child's name"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={createChild.isPending}
                className="flex-1 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createChild.isPending ? 'Adding...' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setChildName('')
                }}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
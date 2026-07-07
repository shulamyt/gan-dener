import { useState } from 'react'
import type { Family } from '../types'

interface FamilyFormProps {
  family?: Family
  onSubmit: (data: Partial<Family>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function FamilyForm({ family, onSubmit, onCancel, isLoading }: FamilyFormProps) {
  const [formData, setFormData] = useState({
    name: family?.name || '',
    balance: family?.balance || 0,
    parentPhoneNumber: family?.parentPhoneNumber || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Family Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter family name"
        />
      </div>

      <div>
        <label htmlFor="parentPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Parent Phone Number
        </label>
        <input
          type="tel"
          id="parentPhoneNumber"
          value={formData.parentPhoneNumber}
          onChange={(e) => setFormData({ ...formData, parentPhoneNumber: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="+972-50-123-4567"
        />
      </div>

      <div>
        <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
          Initial Balance (₪)
        </label>
        <input
          type="number"
          id="balance"
          step="0.01"
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : family ? 'Update Family' : 'Add Family'}
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
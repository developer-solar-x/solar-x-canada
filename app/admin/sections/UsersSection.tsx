'use client'

import { Users, UserPlus, Mail, Shield, Calendar, Edit, Trash2, CheckCircle, XCircle, User as UserIcon } from 'lucide-react'
import { SkeletonUserTableRow } from '@/components/admin/SkeletonLoader'

interface UsersSectionProps {
  users: any[]
  usersLoading: boolean
  onAddUser: () => void
  onEditUser: (user: any) => void
  onDeleteUser: (user: any) => void
}

export function UsersSection({
  users,
  usersLoading,
  onAddUser,
  onEditUser,
  onDeleteUser,
}: UsersSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">User Management</h1>
          <p className="text-gray-600">Manage admin users and permissions</p>
        </div>
        <button 
          onClick={onAddUser}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {usersLoading ? (
        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonUserTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border-2 border-gray-100 rounded-xl p-16 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <Users size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first admin user</p>
          <button 
            onClick={onAddUser}
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus size={20} />
            Add User
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 transition-all group border-l-4 border-transparent hover:border-navy-400"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-navy-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-navy-200 group-hover:to-blue-200 transition-all">
                          <UserIcon size={20} className="text-navy-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-navy-700 transition-colors">
                            {user.full_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <a href={`mailto:${user.email}`} className="text-sm text-gray-900 hover:text-navy-600 font-medium transition-colors">
                          {user.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm capitalize">
                        <Shield size={12} />
                        {user.role === 'superadmin' ? 'Super Admin' : user.role || 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                          <XCircle size={12} />
                          Inactive
                      </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-all border border-blue-200 hover:border-blue-300"
                      >
                          <Edit size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-all border border-red-200 hover:border-red-300"
                      >
                          <Trash2 size={14} />
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


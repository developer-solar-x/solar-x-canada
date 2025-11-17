'use client'

import { Clock } from 'lucide-react'

interface ActivityTabProps {
  notes: any[]
  activities: any[]
}

export function ActivityTab({ notes, activities }: ActivityTabProps) {
  return (
    <div className="space-y-3">
      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-navy-500 mb-3">Notes</h3>
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-gray-500">
                    {note.created_by || 'Admin'} • {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Activities Section */}
      <div>
        <h3 className="text-lg font-bold text-navy-500 mb-3">Activity Log</h3>
        {activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="card p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold capitalize text-navy-600">
                      {a.activity_type.replace('_',' ')}
                    </div>
                    {a.activity_data && (
                      <div className="text-xs text-gray-600 mt-1">
                        {a.activity_type === 'status_change' && (
                          <span>
                            Changed from <span className="font-semibold">{a.activity_data.old_status}</span> to <span className="font-semibold">{a.activity_data.new_status}</span>
                          </span>
                        )}
                        {a.activity_type === 'note_added' && (
                          <span>Note added: {a.activity_data.note_preview || 'Note added'}</span>
                        )}
                        {a.activity_type === 'hubspot_sync' && (
                          <span>Synced to HubSpot {a.activity_data.contactId ? `(Contact: ${a.activity_data.contactId.substring(0, 8)}...)` : ''}</span>
                        )}
                        {a.activity_type === 'email_sent' && (
                          <span>Email sent {a.activity_data.subject ? `: ${a.activity_data.subject}` : ''}</span>
                        )}
                        {a.activity_type === 'estimate_updated' && (
                          <span>Estimate updated {a.activity_data.field ? `: ${a.activity_data.field}` : ''}</span>
                        )}
                      </div>
                    )}
                    {!a.activity_data && (
                      <div className="text-xs text-gray-500 mt-1 italic">
                        No additional details
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs text-gray-400 mt-2">Activities will appear here as you interact with this lead</p>
          </div>
        )}
      </div>
    </div>
  )
}


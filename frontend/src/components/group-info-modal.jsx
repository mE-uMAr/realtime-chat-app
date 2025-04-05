"use client"

import { X } from "lucide-react"

const GroupInfoModal = ({ group, users, onClose }) => {
  // Find user details for each member ID
  const getMembers = () => {
    if (!group.member_ids || !users) return []

    return group.member_ids.map((id) => {
      const user = users.find((u) => u.id === id)
      return user || { id, username: "Unknown User" }
    })
  }

  const members = getMembers()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Group Information</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Group Name</h4>
          <p>{group.name}</p>
        </div>

        {group.description && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Description</h4>
            <p>{group.description}</p>
          </div>
        )}

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Members ({members.length})</h4>
          <div className="border rounded max-h-60 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center p-2 border-b">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                  {member.username.charAt(0)}
                </div>
                <span>{member.username}</span>
                {member.id === group.creator_id && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Creator</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupInfoModal


"use client"

import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { Users, MessageSquare, LogOut, Plus, Search } from "lucide-react"
import CreateGroupModal from "./create-group-modal"

const Sidebar = ({ users, groups, onlineUsers, currentUser, onCreateGroup, onLogout, isLoading }) => {
  const [activeTab, setActiveTab] = useState("chats")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()

  const handleCreateGroup = (name, description, members) => {
    const groupData = {
      name,
      description,
      member_ids: members,
    }

    onCreateGroup(groupData)
      .then(() => setShowCreateGroup(false))
      .catch(() => {}) // Error is handled in the parent component
  }

  // Filter users and groups based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUser?.id &&
      (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))),
  )

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold">Chat App</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">{currentUser?.username}</span>
          <button onClick={onLogout} className="text-red-500 hover:text-red-700" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="p-3 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "chats" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("chats")}
        >
          <MessageSquare size={18} className="inline mr-1" />
          Chats
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "users" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={18} className="inline mr-1" />
          Users
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" && (
          <div>
            <div className="p-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Groups</h3>
                <button onClick={() => setShowCreateGroup(true)} className="text-blue-500 hover:text-blue-700">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading groups...</div>
            ) : (
              <>
                {filteredGroups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? "No groups match your search" : "No groups yet"}
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <NavLink
                      key={group.id}
                      to={`/chat/group/${group.id}`}
                      className={({ isActive }) => `
                        p-3 border-b cursor-pointer hover:bg-gray-100 flex items-center
                        ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}
                      `}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        {group.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-xs text-gray-500">{group.member_ids.length} members</p>
                      </div>
                    </NavLink>
                  ))
                )}
              </>
            )}

            <div className="p-3 border-b">
              <h3 className="font-semibold">Direct Messages</h3>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : (
              <>
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? "No users match your search" : "No users available"}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <NavLink
                      key={user.id}
                      to={`/chat/private/${user.id}`}
                      className={({ isActive }) => `
                        p-3 border-b cursor-pointer hover:bg-gray-100 flex items-center
                        ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}
                      `}
                    >
                      <div className="relative mr-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {user.username.charAt(0)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            onlineUsers[user.id] ? "bg-green-500" : "bg-gray-500"
                          }`}
                        ></span>
                      </div>
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        <p className="text-xs text-gray-500">{onlineUsers[user.id] ? "Online" : "Offline"}</p>
                      </div>
                    </NavLink>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : (
              <>
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? "No users match your search" : "No users available"}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <NavLink
                      key={user.id}
                      to={`/chat/private/${user.id}`}
                      className={({ isActive }) => `
                        p-3 border-b cursor-pointer hover:bg-gray-100 flex items-center
                        ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}
                      `}
                      onClick={() => setActiveTab("chats")}
                    >
                      <div className="relative mr-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {user.username.charAt(0)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            onlineUsers[user.id] ? "bg-green-500" : "bg-gray-500"
                          }`}
                        ></span>
                      </div>
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        {user.full_name && <p className="text-xs text-gray-500">{user.full_name}</p>}
                      </div>
                    </NavLink>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          users={users.filter((user) => user.id !== currentUser?.id)}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  )
}

export default Sidebar


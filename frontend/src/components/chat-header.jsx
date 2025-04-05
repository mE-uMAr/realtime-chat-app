"use client"

import { useState } from "react"
import { Info, Users } from "lucide-react"
import GroupInfoModal from "./group-info-modal"

const ChatHeader = ({ chatType, chatDetails, users }) => {
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          {chatType === "private" ? chatDetails.username?.charAt(0) : chatDetails.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {chatType === "private" ? chatDetails.username : chatDetails.name}
          </h1>
          {chatType === "private" && chatDetails.full_name && (
            <p className="text-sm text-gray-500">{chatDetails.full_name}</p>
          )}
          {chatType === "group" && (
            <p className="text-sm text-gray-500">{chatDetails.member_ids?.length || 0} members</p>
          )}
        </div>
      </div>

      {chatType === "group" && (
        <button className="text-blue-500 hover:text-blue-700 flex items-center" onClick={() => setShowGroupInfo(true)}>
          <Users size={18} className="mr-1" />
          <span>Members</span>
        </button>
      )}

      {chatType === "private" && (
        <button className="text-blue-500 hover:text-blue-700 flex items-center">
          <Info size={18} className="mr-1" />
          <span>Info</span>
        </button>
      )}

      {showGroupInfo && chatDetails && (
        <GroupInfoModal group={chatDetails} users={users} onClose={() => setShowGroupInfo(false)} />
      )}
    </header>
  )
}

export default ChatHeader


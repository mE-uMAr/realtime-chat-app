import { MessageSquare } from "lucide-react"

const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="bg-blue-100 p-6 rounded-full inline-block mb-4">
          <MessageSquare size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Chat App</h2>
        <p className="text-gray-600 mb-6">
          Select a conversation from the sidebar or start a new one to begin chatting.
        </p>
        <div className="text-sm text-gray-500">
          <p>• Chat privately with friends</p>
          <p>• Create group conversations</p>
          <p>• Share messages in real-time</p>
        </div>
      </div>
    </div>
  )
}

export default EmptyState


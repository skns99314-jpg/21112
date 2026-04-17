export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  is_group: boolean
  title: string | null
  created_by: string | null
  created_at: string
  last_message_at: string
}

export type ConversationMember = {
  conversation_id: string
  user_id: string
  joined_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  media_url: string | null
  media_type: "image" | "video" | "audio" | "file" | null
  created_at: string
}

export type ConversationListItem = {
  conversation: Conversation
  other: Profile | null
  members: Profile[]
  last_message: Message | null
  unread_count: number
}

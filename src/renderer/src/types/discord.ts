export interface DiscordMessage {
  id: string
  author: string
  author_name: string
  global_author_name: string
  avatar_id: string
  channel: string

  nickname?: string
  content?: string
  time?: string

  sticker_id?: string
  sticker_name?: string
  sticker_type?: number

  mentions?: DiscordUserMention[]
  attachments?: DiscordAttachment[]
}

export interface DiscordUserMention {
  id: string
  username: string
  discriminator: string
  avatar?: string
}

export interface DiscordAttachment {
  id: string
  filename: string
  size: number
  url: string
  proxy_url: string
  width?: number
  height?: number
  content_type?: string
  description?: string
}

export const STICKER_TYPE_TO_EXTENSION: Record<number, string> = {
  1: 'webp',
  2: 'png',
  3: 'json',
  4: 'gif'
}

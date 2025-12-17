import React from 'react'
import Lottie from 'react-lottie-player'
import { DiscordMessage, DiscordUserMention, STICKER_TYPE_TO_EXTENSION } from '../types/discord'

interface MessageProps {
  message: DiscordMessage
  channelNickname?: string
}

const fallbackAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png'
const avatarBaseUrl = 'https://cdn.discordapp.com/avatars/'

const hammerTimeToDateString = (hammerTime: string): string => {
  const match = hammerTime.match(/<t:(\d+)(?::[tTdDfFR])?>/)
  if (!match) {
    return 'Unknown Timestamp'
  }
  const timestamp = parseInt(match[1], 10)
  if (isNaN(timestamp)) {
    return 'Unknown Timestamp'
  }
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

interface ParsedContent {
  html: string
  imageUrls: string[]
  videoUrls: string[]
}

const processRenderedContent = (
  content: string,
  mentions?: DiscordUserMention[]
): ParsedContent => {
  let parsedContent = content
  const imageUrls: string[] = []
  const videoUrls: string[] = []

  // Replace user mentions <@user_id> with usernames
  if (mentions && mentions.length > 0) {
    mentions.forEach((mention) => {
      const mentionRegex = new RegExp(`<@!?${mention.id}>`, 'g')
      parsedContent = parsedContent.replace(
        mentionRegex,
        `<span class="mention">@${mention.username}</span>`
      )
    })
  }

  parsedContent = parsedContent.replace(/<@!?(\d+)>/g, '<span class="mention">@unknown</span>')
  // Roles are a placeholder for now cause can't find a good way to get the names of them
  parsedContent = parsedContent.replace(/<@&?(\d+)>/g, '<span class="mention">@RoleMention</span>')
  parsedContent = parsedContent.replace(/@everyone/g, '<span class="mention">@everyone</span>')
  parsedContent = parsedContent.replace(/<t:\d+(?::[tTdDfFR])?>/g, (match) => {
    return (
      '<span class="hammertime-timestamp ">' +
      hammerTimeToDateString(match) +
      ' (your local time) </span>'
    )
  })
  // Replace Discord emote syntax <:name:id> and <a:name:id> with img tags FIRST
  parsedContent = parsedContent.replace(/<(a?):([^:]+):(\d+)>/g, (_, animated, name, id) => {
    // Validate that we have a proper ID
    if (!id || id === '0' || !/^\d+$/.test(id) || !name.trim()) {
      return `[${name || 'emote'}]` // Fallback for invalid emotes
    }

    const extension = animated === 'a' ? 'gif' : 'webp'
    const safeName = name.replace(/['"<>&]/g, (char) => {
      const entities: Record<string, string> = {
        "'": '&#39;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
      }
      return entities[char] || char
    })
    const safeUrl = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=64`
    return `<img src="${safeUrl}" alt="${safeName}" class="inline-emote" onerror="this.outerHTML='[${safeName}]';" />`
  })

  // Also handle any remaining malformed emote patterns
  parsedContent = parsedContent.replace(/<a?:[^>]*>/g, (match) => {
    // Extract name if possible for fallback
    const nameMatch = match.match(/<a?:([^:>]+)/)
    const fallbackName = nameMatch ? nameMatch[1] : 'emote'
    return `[${fallbackName}]`
  })

  // First, protect existing img tags by replacing them with placeholders
  const imgPlaceholders: string[] = []
  parsedContent = parsedContent.replace(/<img[^>]*>/g, (imgTag) => {
    const placeholder = `__IMG_PLACEHOLDER_${imgPlaceholders.length}__`
    imgPlaceholders.push(imgTag)
    return placeholder
  })

  // Now handle URLs safely
  const urlRegex = /(https?:\/\/[^\s]+)/g
  parsedContent = parsedContent.replace(urlRegex, (url) => {
    // Check if URL ends with image extension
    const imageExtensions = /\.(png|jpe?g|gif|webp)(\?[^\s]*)?$/i
    const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)(\?[^\s]*)?$/i
    if (videoExtensions.test(url)) {
      videoUrls.push(url)
      return '' // Remove video URL from content
    }
    if (imageExtensions.test(url)) {
      imageUrls.push(url)
      return '' // Remove image URL from content
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  })

  // Restore img tags from placeholders
  imgPlaceholders.forEach((imgTag, index) => {
    const placeholder = `__IMG_PLACEHOLDER_${index}__`
    parsedContent = parsedContent.replace(placeholder, imgTag)
  })
  // Convert newlines to HTML line breaks
  parsedContent = parsedContent.replace(/\n/g, '<br>')

  return { html: parsedContent, imageUrls, videoUrls }
}

const Message: React.FC<MessageProps> = ({ message, channelNickname }) => {
  const {
    author,
    author_name,
    avatar_id,
    nickname,
    content,
    time,
    attachments,
    sticker_id,
    sticker_name,
    sticker_type,
    mentions
  } = message
  let avatarUrl = avatarBaseUrl + author + '/' + avatar_id + '.webp?size=80'
  if (author === null || avatar_id === null) {
    avatarUrl = fallbackAvatar
  }

  const displayName = nickname || author_name
  const displayTime = time
    ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  // Separate image and non-image attachments
  const imageAttachments =
    attachments?.filter((att) => att.content_type?.startsWith('image/')) || []
  const videoAttachments =
    attachments?.filter((att) => att.content_type?.startsWith('video/')) || []
  const nonImageAttachments =
    attachments?.filter(
      (att) => !att.content_type?.startsWith('image/') && !att.content_type?.startsWith('video/')
    ) || []

  const renderSticker = (): React.JSX.Element | null => {
    if (!sticker_id || sticker_type === undefined) return null

    // Type 3 is Lottie animation
    if (sticker_type === 3) {
      const lottieUrl = `https://discord.com/stickers/${sticker_id}.json`
      return (
        <div className="attachment-container">
          <Lottie
            loop
            path={lottieUrl}
            play
            style={{ width: 128, height: 128 }}
            className="sticker-img lottie-sticker"
          />
        </div>
      )
    }

    const stickerImageUrl = `https://media.discordapp.net/stickers/${sticker_id}.${STICKER_TYPE_TO_EXTENSION[sticker_type]}?size=128`
    return (
      <div className="attachment-container">
        <img
          src={stickerImageUrl}
          alt={sticker_name}
          className="sticker-img"
          onError={(e) => {
            console.error('Static sticker failed to load:', stickerImageUrl)
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  return (
    <div className="msg">
      <img className="avatar" src={avatarUrl || fallbackAvatar} alt={author_name} />

      <div className="body">
        <div className="meta">
          <span className="username">{displayName}</span>
          {channelNickname && <span className="channel-name">#{channelNickname}</span>}
          <span className="timestamp">{displayTime}</span>
        </div>

        <div className="content">
          {(() => {
            if (!content) return null

            const parsed = processRenderedContent(content, mentions)

            return (
              <>
                <div dangerouslySetInnerHTML={{ __html: parsed.html }} />

                {/* Render extracted image URLs as React components */}
                {parsed.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="attachment-container">
                    <img
                      src={imageUrl}
                      alt="Content image"
                      style={{
                        maxWidth: '400px',
                        maxHeight: '300px',
                        borderRadius: '6px',
                        marginTop: '8px',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ))}

                {/* Render extracted video URLs as React components */}
                {parsed.videoUrls.map((videoUrl, index) => (
                  <div key={index} className="attachment-container">
                    <video
                      src={videoUrl}
                      controls
                      style={{
                        maxWidth: '400px',
                        maxHeight: '300px',
                        borderRadius: '6px',
                        marginTop: '8px',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </>
            )
          })()}

          {renderSticker()}

          {/* Render all image attachments */}
          {imageAttachments.map((attachment, index) => (
            <div key={`img-${attachment.id || index}`} className="attachment-container">
              <img
                src={attachment.proxy_url || attachment.url}
                alt={attachment.filename}
                style={{
                  maxWidth: '400px',
                  maxHeight: '300px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  display: 'block',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const fullscreenImg = document.createElement('img')
                  fullscreenImg.src = attachment.proxy_url || attachment.url
                  fullscreenImg.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    object-fit: contain;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 9999;
                    cursor: pointer;
                  `
                  fullscreenImg.onclick = () => document.body.removeChild(fullscreenImg)
                  document.body.appendChild(fullscreenImg)
                }}
                onError={(e) => {
                  console.error('Attachment image failed to load:', attachment.filename)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ))}

          {/* Render all video attachments */}
          {videoAttachments.map((attachment, index) => (
            <div key={`video-${attachment.id || index}`} className="attachment-container">
              <video
                src={attachment.proxy_url || attachment.url}
                controls
                style={{
                  maxWidth: '400px',
                  maxHeight: '300px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('Attachment video failed to load:', attachment.filename)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ))}

          {/* Render non-image attachments as clickable links */}
          {nonImageAttachments.map((attachment, index) => (
            <div key={`file-${attachment.id || index}`} className="attachment-container">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-attachment"
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  background: 'var(--channel)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: 'var(--accent-blue)',
                  marginTop: '8px'
                }}
              >
                📎 {attachment.filename}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Message

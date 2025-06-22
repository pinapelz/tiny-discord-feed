import { useEffect, useState } from 'react'
import Message from './components/Message'
import ConfigModal from './components/ConfigModal'
import { DiscordMessage } from './types/discord'

function App(): React.JSX.Element {
  const [messages, setMessages] = useState<DiscordMessage[]>([])
  const [channelNicknames, setChannelNicknames] = useState<Record<string, string>>({})
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isMouseInWindow, setIsMouseInWindow] = useState(true)
  const [maxMessages, setMaxMessages] = useState<number>(300)

  // Load channel nicknames and max messages on mount
  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const nicknames = await window.electron.config.getChannelNicknames()
        setChannelNicknames(nicknames)

        const maxMsgs = await window.electron.config.getMaxMessages()
        setMaxMessages(maxMsgs)
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }

    loadConfig()
  }, [])

  useEffect(() => {
    const listener = (...args: unknown[]): void => {
      const data = args[0] as DiscordMessage

      if (data) {
        setMessages((prev) => {
          const existingMessage = prev.find((msg) => msg.id === data.id)
          if (existingMessage) {
            return prev
          }
          return [data, ...prev.slice(0, maxMessages - 1)]
        })
      }
    }

    window.electron.ipcRenderer.on('new-discord-message', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('new-discord-message', listener)
    }
  }, [])

  return (
    <div
      id="app-container"
      onMouseEnter={() => setIsMouseInWindow(true)}
      onMouseLeave={() => setIsMouseInWindow(false)}
    >
      {/* Header */}
      <div
        className="app-header"
        style={{
          opacity: isMouseInWindow ? 1 : 0,
          transform: isMouseInWindow ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: isMouseInWindow ? 'auto' : 'none'
        }}
      >
        <div className="app-title">tiny-discord-feed</div>
        <div className="header-controls">
          <div className="channel-count">
            {Object.keys(channelNicknames).length} channels configured
          </div>
          <button className="config-button" onClick={() => setIsConfigOpen(true)}>
            ⚙️ Configure
          </button>
        </div>
      </div>

      {/* Messages */}
      <div id="messages">
        {(() => {
          if (Object.keys(channelNicknames).length === 0) {
            return (
              <div className="empty-state">
                <div className="icon">⚙️</div>
                <div>No channels configured</div>
                <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                  Click &quot;Configure&quot; to add channels to monitor
                </div>
              </div>
            )
          }

          // Filter messages from configured channels and limit to 30 displayed
          const filteredMessages = messages
            .filter((msg) => channelNicknames[msg.channel])
            .filter(
              (msg) =>
                !(
                  (msg.content === '' || msg.content === undefined) &&
                  !msg.sticker_id &&
                  (!msg.attachments || msg.attachments.length === 0)
                )
            )
            .slice(0, 30)

          if (filteredMessages.length === 0) {
            return (
              <div className="empty-state">
                <div className="icon">💬</div>
                <div>No messages from configured channels yet</div>
                <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                  Messages will appear here when received from your configured channels
                </div>
              </div>
            )
          }

          return filteredMessages.map((msg, i) => (
            <Message
              key={msg.id || i}
              message={msg}
              channelNickname={channelNicknames[msg.channel] || msg.channel}
            />
          ))
        })()}
      </div>

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => {
          setIsConfigOpen(false)
          // Reload config after changes
          window.electron.config.getChannelNicknames().then(setChannelNicknames)
          window.electron.config.getMaxMessages().then(setMaxMessages)
        }}
      />
    </div>
  )
}

export default App

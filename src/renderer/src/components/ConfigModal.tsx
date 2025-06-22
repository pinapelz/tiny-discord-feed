import { useState, useEffect } from 'react'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ChannelConfig {
  id: string
  nickname: string
}

export default function ConfigModal({
  isOpen,
  onClose
}: ConfigModalProps): React.JSX.Element | null {
  const [channels, setChannels] = useState<ChannelConfig[]>([])
  const [newChannelId, setNewChannelId] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [maxMessages, setMaxMessages] = useState<number>(300)
  const [tempMaxMessages, setTempMaxMessages] = useState<number>(300)

  useEffect(() => {
    if (isOpen) {
      loadChannels()
      loadMaxMessages()
    }
  }, [isOpen])

  const loadChannels = async (): Promise<void> => {
    try {
      const channelList = await window.electron.config.getChannelList()
      setChannels(channelList)
    } catch (error) {
      console.error('Failed to load channels:', error)
    }
  }

  const loadMaxMessages = async (): Promise<void> => {
    try {
      const maxMsgs = await window.electron.config.getMaxMessages()
      setMaxMessages(maxMsgs)
      setTempMaxMessages(maxMsgs)
    } catch (error) {
      console.error('Failed to load max messages:', error)
    }
  }

  const handleSaveMaxMessages = async (): Promise<void> => {
    try {
      await window.electron.config.setMaxMessages(tempMaxMessages)
      setMaxMessages(tempMaxMessages)
    } catch (error) {
      console.error('Failed to save max messages:', error)
    }
  }

  const handleAddChannel = async (): Promise<void> => {
    if (!newChannelId.trim() || !newNickname.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await window.electron.config.setChannelNickname(newChannelId.trim(), newNickname.trim())
      setNewChannelId('')
      setNewNickname('')
      await loadChannels()
    } catch (error) {
      console.error('Failed to add channel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveChannel = async (channelId: string): Promise<void> => {
    try {
      await window.electron.config.removeChannelNickname(channelId)
      await loadChannels()
    } catch (error) {
      console.error('Failed to remove channel:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleAddChannel()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Channel Configuration</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="max-messages-section">
            <h3>Message Limit</h3>
            <div className="input-group">
              <label>Maximum messages to keep in memory:</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={tempMaxMessages}
                onChange={(e) => setTempMaxMessages(parseInt(e.target.value) || 300)}
              />
              <button
                onClick={handleSaveMaxMessages}
                disabled={tempMaxMessages === maxMessages}
              >
                Save
              </button>
            </div>
            <p className="help-text">
              Current: {maxMessages} messages. Higher values use more memory but keep more message history.
            </p>
          </div>

          <div className="add-channel-section">
            <h3>Add Channel</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Channel ID"
                value={newChannelId}
                onChange={(e) => setNewChannelId(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <input
                type="text"
                placeholder="Nickname"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                onClick={handleAddChannel}
                disabled={isLoading || !newChannelId.trim() || !newNickname.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="channel-list-section">
            <h3>Configured Channels ({channels.length})</h3>
            {channels.length === 0 ? (
              <div className="empty-channels">
                <p>No channels configured yet.</p>
                <p>Add channel IDs above to filter messages.</p>
              </div>
            ) : (
              <div className="channel-list">
                {channels.map((channel) => (
                  <div key={channel.id} className="channel-item">
                    <div className="channel-info">
                      <div className="channel-nickname">{channel.nickname}</div>
                      <div className="channel-id">{channel.id}</div>
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveChannel(channel.id)}
                      title="Remove channel"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
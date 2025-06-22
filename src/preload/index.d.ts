declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data?: unknown) => void
        on: (channel: string, func: (...args: unknown[]) => void) => void
        removeListener: (channel: string, func: (...args: unknown[]) => void) => void
      }
      config: {
        getChannelNicknames: () => Promise<Record<string, string>>
        setChannelNickname: (channelId: string, nickname: string) => Promise<boolean>
        removeChannelNickname: (channelId: string) => Promise<boolean>
        getChannelList: () => Promise<Array<{ id: string; nickname: string }>>
        getMaxMessages: () => Promise<number>
        setMaxMessages: (maxMessageNum: number) => Promise<boolean>
      }
    }
  }
}

export {}

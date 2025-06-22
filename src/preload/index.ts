import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data?: unknown) => ipcRenderer.send(channel, data),
    on: (channel: string, func: (...args: unknown[]) => void) =>
      ipcRenderer.on(channel, (_: IpcRendererEvent, ...args) => func(...args)),
    removeListener: (channel: string, func: (...args: unknown[]) => void) =>
      ipcRenderer.removeListener(channel, func)
  },
  config: {
    getChannelNicknames: () => ipcRenderer.invoke('config:get-channel-nicknames'),
    setChannelNickname: (channelId: string, nickname: string) =>
      ipcRenderer.invoke('config:set-channel-nickname', channelId, nickname),
    removeChannelNickname: (channelId: string) =>
      ipcRenderer.invoke('config:remove-channel-nickname', channelId),
    getChannelList: () => ipcRenderer.invoke('config:get-channel-list'),
    getMaxMessages: () => ipcRenderer.invoke('config:get-max-messages'),
    setMaxMessages: (maxMessageNum: number) =>
      ipcRenderer.invoke('config:set-max-messages', maxMessageNum)
  }
})

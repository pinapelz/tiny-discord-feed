# tiny-discord-feed

Get your Discord messages as a singular mega feed. Requires BetterDiscord

![image](https://github.com/user-attachments/assets/bb792c63-9f5e-49a5-970b-c9a397183e87)
> Compatible and responsive with any display size, although a vertical display looks the nicest

# Setup
1. Download and Install [BetterDiscord](https://betterdiscord.app/)
2. Head to settings and find the Plugins section (under BetterDiscord). From here click the folder icon to open the folder where plugins are stored
3. Download the [BDFireToWebSocket](https://github.com/pinapelz/BDFireToWebsocket/releases/latest/download/BDFireToWebsocket.plugin.js) plugin file, and drag this into that folder
4. Clone this repo and run this application (Install Node and pnpm if you haven't already)
```
git clone https://github.com/pinapelz/tiny-discord-feed
pnpm install
pnpm start
```
**(Builds not available at this time. Please run from source)**

5. Click configure in the top right. You'll need to configure the channels you want to receive messages for as well as give them an alias.

> To get the Channel ID for either a DM or a channel in a server, simply right click on it in Discord and choose `Copy Channel ID`

6. Head back to Discord and go to the Plugins tab again. From here click on the `Settings` icon under the BDFireToWebSocket plugin and "Reconnect to WebSocket"


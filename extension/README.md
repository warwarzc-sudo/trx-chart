# TRX Chart Companion - Extension

Chrome extension to auto-track TRX WinGo bets and sync with TRX Chart in real-time.

**Version:** 1.0.4  
**Compatible:** Chrome, Edge, Brave (Desktop + Tablet)

---

## ✨ Features

- ✅ Auto-track all bet placements (instant capture)
- ✅ Live win/loss results
- ✅ Real-time balance updates
- ✅ Auto-sync stats to TRX Chart app
- ✅ **Mobile/Tablet support** (iframe bet capture)
- ✅ Floating Bet Tracker UI (draggable)
- ✅ Works inside chart iframe

---

## 📦 Installation

### Method 1: Manual Install (Recommended)

1. Download this folder (or clone repo)
   ```
   git clone https://github.com/YOUR_USERNAME/trx-chart-companion.git
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder
6. Done! Icon appears in toolbar 🎯

### Method 2: Download Release

1. Go to [Releases](../../releases)
2. Download latest `.zip`
3. Extract and follow Method 1 from step 2

---

## 🚀 Usage

### Desktop:
1. Go to https://6win598.com and login
2. Play normally - all bets auto-tracked
3. Open https://trx-chart.pages.dev to see stats

### Tablet/Mobile:
1. Open https://trx-chart.pages.dev
2. Game opens inside iframe
3. Resize panel by dragging the handle
4. Bets captured automatically from iframe

---

## 🎮 Chart Features

- **Toggle Game** - Show/Hide game panel
- **Panel Size** - Resize game panel
- **Hide Panel** - Full chart view
- **Bet Tracker** - Live profit/loss
- **Reload/Popup** - Quick game controls

---

## 🔒 Privacy

- ✅ All data stays on your device
- ✅ No external servers
- ✅ No tracking or analytics
- ✅ Open source - audit the code

---

## 🔐 Permissions

| Permission | Why |
|-----------|-----|
| `storage` | Save bet data locally |
| `activeTab` | Detect current site |
| `tabs` | Communicate with chart tab |
| `declarativeNetRequest` | Allow iframe embedding |
| `host_permissions` | Read API responses on 6win598.com |

---

## 📁 File Structure

```
extension/
├── manifest.json          # Extension config (v1.0.4)
├── background.js          # Service worker - data storage
├── content-script.js      # API interceptor + floating UI
├── injected.js            # Fetch/XHR hooks (in-page)
├── rules.json             # iframe headers (X-Frame-Options removal)
├── popup.html             # Extension popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠️ Development

### Tech Stack:
- **Manifest V3** (latest Chrome extension API)
- **Service Worker** for background tasks
- **Content Scripts** for page injection
- **Declarative Net Request** for header modification

### Local Development:
1. Make code changes
2. Go to `chrome://extensions/`
3. Click **Reload** on the extension card
4. Test changes

---

## 📝 Changelog

### v1.0.4 (Latest)
- ✅ Mobile/Tablet iframe block fix (rules.json)
- ✅ Touch event support for resize handle
- ✅ Wider resize handle (20px)
- ✅ Hide/Show panel fixes
- ✅ Saved width restoration
- ✅ Reload/Popup buttons relocated
- ✅ Iframe bet capture (all_frames)

### v1.0.3
- Initial release with bet tracking
- API interception (Fetch + XHR)
- Floating Bet Tracker UI

---

## 🐛 Issues

Report bugs at [Issues](../../issues)

---

## 📜 License

Personal use only. Not affiliated with 6win598.com or any betting platform.

# TRX Chart Companion - Extension

Chrome extension to auto-track TRX WinGo bets and sync with TRX Chart.

## Features

- ✅ Auto-track all bet placements
- ✅ Live win/loss results
- ✅ Real-time balance updates
- ✅ Stats syncing to chart app

## Installation (Manual)

1. Download this folder (or clone repo)
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder
6. Done! Icon appears in toolbar

## Usage

1. Go to https://6win598.com and login
2. Play normally - all bets auto-tracked
3. Open https://trx-chart.pages.dev to see stats

## Privacy

- ✅ All data stays on your device
- ✅ No external servers
- ✅ No tracking
- ✅ Open source

## Permissions

- `storage` - Save bet data locally
- `activeTab` - Detect current site
- `host_permissions` - Read API responses on 6win598.com

## Development

Files:
- `manifest.json` - Extension config
- `content-script.js` - API interceptor
- `background.js` - Data storage
- `popup.html` - Extension UI

# MineKakeibo - Personal Finance Web App

## Overview
個人用家計簿・資產管理 Web App。支援多幣別記帳、資產負債管理、預算專案、CSV 匯出與雲端同步。

## Features
- Daily expense tracking
- Multi-currency support: JPY / TWD / KRW / USD / EUR
- Asset and liability overview
- Budget project management
- CSV export
- Cloud sync
- Spending analytics
- Installment expense records

## Tech Stack
- Frontend: HTML, JavaScript, Tailwind CSS, Chart.js
- Backend / Database: Supabase（可選雲端同步）
- Offline: Service Worker / PWA App Shell

## Development

```bash
npm install
npm run build
npm test
```

`index.html` 是唯一應用程式入口。舊的 `budget-manager-optimized.html`
僅保留相容轉址，避免維護兩份相同程式碼。

## Why I built it
自己在日本生活時，需要同時管理日幣、台幣與日常支出，因此開發這個工具。

## Screenshots

## Future Improvements
- OCR receipt input
- AI spending summary
- Monthly report generation

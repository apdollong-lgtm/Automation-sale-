# Order–Production–Stock–Delivery System (Apps Script)

## Overview
This is a production-ready MVP for SMEs built with Google Apps Script (V8), HTMLService, and Google Sheets as the database.

## Features
- Workspace domain login with PIN fallback
- Role-based access (ADMIN/STAFF/VIEWER)
- Order, production, stock, shipment flows
- Stock ledger (append-only) and reservations with LockService
- PDF document generator to Drive
- Thai-first UI with i18n-ready strings

## Install Guide
1. **Create Spreadsheet**
   - Create a Google Sheet and name it as your database.
   - Open Apps Script and link it to the spreadsheet.

2. **Copy Project Files**
   - Create the files listed in this repo within your Apps Script project.

3. **Set Config**
   - Run `seedDemoData()` once to create all sheets and headers.
   - In `Config` sheet, set:
     - `SpreadsheetId`
     - `TenantId`
     - `AllowedDomain` (e.g. `yourdomain.com`)
     - `FallbackPin` (PIN for non-domain login)
     - `DocsFolderId` (Drive folder for PDFs)

4. **Deploy Web App**
   - Deploy > New deployment > Web app
   - Execute as: **User accessing the web app**
   - Access: **Anyone in domain**

5. **Add Users**
   - Add entries to the `Users` sheet with roles.

6. **Demo Data**
   - Run `seedDemoData()` to populate sample data.

## Screenshots
- Dashboard: `TODO`
- Orders: `TODO`

## Notes
- The system is ready for single-tenant usage while keeping `TenantId` in every table.
- PDF outputs are stored in `/SystemDocs/<Tenant>/<YYYY-MM>/` under the configured Drive folder.

function configRowsToObject_(values) {
  const config = {};
  values.slice(1).forEach(row => {
    if (row[0]) {
      config[row[0]] = row[1];
    }
  });
  return config;
}

function getConfig_() {
  const sheet = getSheet_(SHEETS.CONFIG);
  return configRowsToObject_(sheet.getDataRange().getValues());
}

function getSpreadsheet_() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!activeSpreadsheet) {
    throw new Error('No active spreadsheet. Bind this Apps Script project to a spreadsheet.');
  }

  const configSheet = activeSpreadsheet.getSheetByName(SHEETS.CONFIG);
  if (!configSheet) {
    return activeSpreadsheet;
  }

  const config = configRowsToObject_(configSheet.getDataRange().getValues());
  const configuredId = (config.SpreadsheetId || '').toString().trim();

  if (!configuredId || configuredId === activeSpreadsheet.getId()) {
    return activeSpreadsheet;
  }

  return SpreadsheetApp.openById(configuredId);
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet not found: ${name}`);
  }
  return sheet;
}

function readAll_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== '')).map(row => rowToObject_(headers, row));
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx];
  });
  return obj;
}

function appendRow_(sheetName, rowObj) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => rowObj[header] || '');
  sheet.appendRow(row);
}

function updateRowById_(sheetName, idColumn, idValue, patch) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex < 0) throw new Error(`Column ${idColumn} not found`);
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === idValue) {
      headers.forEach((header, idx) => {
        if (patch[header] !== undefined) {
          values[i][idx] = patch[header];
        }
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([values[i]]);
      return;
    }
  }
  throw new Error(`${sheetName} record not found for ${idValue}`);
}

function upsertRow_(sheetName, idColumn, rowObj) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex < 0) throw new Error(`Column ${idColumn} not found`);

  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] === rowObj[idColumn]) {
      const updated = headers.map(header => rowObj[header] !== undefined ? rowObj[header] : values[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updated]);
      return { updated: true };
    }
  }
  const row = headers.map(header => rowObj[header] || '');
  sheet.appendRow(row);
  return { created: true };
}

function findUserByEmail_(email) {
  if (!email) return null;
  const users = readAll_(SHEETS.USERS);
  return users.find(user => user.Email === email && (user.Active === '' || user.Active === true || user.Active === 'TRUE' || user.Active === 'true')) || null;
}

function nextId_(prefix) {
  return `${prefix}-${Utilities.getUuid().slice(0, 8)}`;
}

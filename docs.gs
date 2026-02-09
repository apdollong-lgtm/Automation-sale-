function generatePdf_(type, refId, me) {
  const tenantId = me.tenantId;
  const template = HtmlService.createTemplateFromFile('views/pages/pdf_template');
  template.doc = buildDocData_(type, refId, tenantId);
  const html = template.evaluate().getContent();
  const blob = Utilities.newBlob(html, 'text/html', `${type}-${refId}.html`);
  const pdf = blob.getAs('application/pdf');

  const config = getConfig_();
  const rootFolderId = config.DocsFolderId;
  if (!rootFolderId) throw new Error('DocsFolderId not configured');
  const root = DriveApp.getFolderById(rootFolderId);
  const monthFolderName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  const tenantFolder = getOrCreateFolder_(root, tenantId);
  const monthFolder = getOrCreateFolder_(tenantFolder, monthFolderName);
  const file = monthFolder.createFile(pdf).setName(`${type}-${refId}.pdf`);

  return { url: file.getUrl(), id: file.getId() };
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function buildDocData_(type, refId, tenantId) {
  return {
    type,
    refId,
    tenantId,
    generatedAt: new Date(),
  };
}

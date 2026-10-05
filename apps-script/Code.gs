const CONFIG = {
  SPREADSHEET_ID: "REPLACE_WITH_GOOGLE_SHEET_ID",
  SHEET_NAME: "Orders"
};

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_campaign_id",
  "utm_adset",
  "utm_adset_id",
  "utm_ad",
  "utm_ad_id",
  "utm_content",
  "utm_term",
  "utm_placement",
  "device_platform"
];

const HEADERS = [
  "created_at",
  "order_id",
  "name",
  "phone",
  ...UTM_FIELDS,
  "landing_page",
  "referrer"
];

function doGet() {
  return HtmlService.createHtmlOutput("DERMOCARE order receiver is ready.");
}

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const requestId = String(parameters.request_id || "");

  try {
    if (!/^[\w-]{1,100}$/.test(requestId)) throw new Error("Invalid request reference.");

    const name = cleanText_(parameters.name, 100);
    const phone = String(parameters.phone || "").replace(/\D/g, "");
    if (!name) throw new Error("Name is required.");
    if (!/^[0-9]{10}$/.test(phone)) throw new Error("A valid 10-digit phone number is required.");
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === "REPLACE_WITH_GOOGLE_SHEET_ID") {
      throw new Error("Google Sheet is not configured.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let orderId;
    try {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        sheet.setFrozenRows(1);
      }

      orderId = Utilities.getUuid();
      const values = [
        orderId,
        name,
        phone,
        ...UTM_FIELDS.map((field) => cleanText_(parameters[field], 500)),
        cleanText_(parameters.landing_page, 2000),
        cleanText_(parameters.referrer, 2000)
      ];
      const row = sheet.getLastRow() + 1;
      sheet.getRange(row, 1).setValue(new Date());
      const textCells = sheet.getRange(row, 2, 1, values.length);
      textCells.setNumberFormat("@");
      textCells.setValues([values]);
    } finally {
      lock.releaseLock();
    }

    return resultPage_({ type: "dermocare-order-result", requestId, orderId, ok: true });
  } catch (error) {
    console.error(error);
    return resultPage_({
      type: "dermocare-order-result",
      requestId,
      ok: false,
      message: "Order save नहीं हो सका। कृपया कुछ देर बाद फिर कोशिश करें।"
    });
  }
}

function cleanText_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function resultPage_(result) {
  const payload = JSON.stringify(result).replace(/</g, "\\u003c");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.parent.postMessage(${payload}, "*");<\/script></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
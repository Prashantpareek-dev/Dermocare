# DERMOCARE order capture setup

The form stores each confirmed order and its attribution fields in a Google Sheet through Apps Script. The browser only redirects to `thankyou.html` after Apps Script confirms that the row was saved.

## Configure Google Sheets

1. Create a Google Sheet for order leads and copy its spreadsheet ID from the URL. The ID is the text between `/d/` and `/edit`.
2. From the sheet, open **Extensions → Apps Script** and replace the editor contents with `Code.gs`.
3. In `Code.gs`, replace `REPLACE_WITH_GOOGLE_SHEET_ID` with the spreadsheet ID. Keep the quotes.
4. Save, then choose **Deploy → New deployment → Web app**. Set **Execute as** to your account and access to **Anyone**. Authorize the requested Sheets access and deploy.
5. Copy the deployed URL ending in `/exec`.
6. In `index.html`, replace `PASTE_DEPLOYED_WEB_APP_URL_HERE` in `GOOGLE_APPS_SCRIPT_URL` with that URL.
7. Host `index.html` and `thankyou.html` at the same site path. The thank-you redirect is relative to `index.html`; local `file://` previews cannot post orders to Apps Script.

The first valid submission creates an `Orders` sheet tab and a header row. Each saved row includes the timestamp, order reference, name, phone, all UTM fields, landing-page URL, and referrer. Restrict spreadsheet access to staff who need to process orders; the sheet contains personal contact data.

## Meta ad URL parameters

Append this query string to the landing-page destination URL in Meta Ads Manager. Meta replaces the braces with the ad's values:

```text
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_campaign_id={{campaign.id}}&utm_adset={{adset.name}}&utm_adset_id={{adset.id}}&utm_ad={{ad.name}}&utm_ad_id={{ad.id}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_placement={{placement}}&device_platform={{device_platform}}
```

The page retains the first captured UTM values for the browser session and submits them with the order. Test using a real deployment and a test spreadsheet before publishing ads.
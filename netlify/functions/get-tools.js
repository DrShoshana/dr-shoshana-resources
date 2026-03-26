const { Client } = require("@notionhq/client");

const DATABASE_ID = "c13b6971-1b8a-423b-ab03-8855fcd86ca6";

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    let allResults = [];
    let cursor = undefined;

    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
          property: "Show on Website",
          checkbox: { equals: true },
        },
        sorts: [{ property: "Tool Code", direction: "ascending" }],
        start_cursor: cursor,
        page_size: 100,
      });

      allResults = allResults.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    const tools = allResults.map((page) => {
      const props = page.properties;

      const getTitle = (prop) =>
        prop?.title?.map((t) => t.plain_text).join("") || "";
      const getText = (prop) =>
        prop?.rich_text?.map((t) => t.plain_text).join("") || "";
      const getSelect = (prop) => prop?.select?.name || "";
      const getMultiSelect = (prop) =>
        prop?.multi_select?.map((s) => s.name) || [];
      const getUrl = (prop) => prop?.url || "";
      const getCheckbox = (prop) => prop?.checkbox || false;

      return {
        id: page.id,
        toolName: getTitle(props["Tool Name"]),
        toolNameFriendly: getText(props["Tool Name (Friendly)"]),
        toolType: getSelect(props["Tool Type"]),
        primaryBucket: getSelect(props["Primary Bucket"]),
        secondaryBuckets: getMultiSelect(props["Secondary Bucket(s)"]),
        audience: getMultiSelect(props["Audience"]),
        description: getText(props["Description"]),
        googleDriveUrl: getUrl(props["Google Drive URL"]),
        toolCode: getText(props["Tool Code"]),
        showOnWebsite: getCheckbox(props["Show on Website"]),
        modalities: getMultiSelect(props["Modalities"]),
        source: getSelect(props["Source"]),
        status: getSelect(props["Status"]),
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tools, count: tools.length }),
    };
  } catch (error) {
    console.error("Notion API error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

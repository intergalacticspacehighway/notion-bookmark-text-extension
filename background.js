// background.js
const NOTION_API_KEY = "NOTION_API_KEY";
const NOTION_DATABASE_ID = "NOTION_DATABASE_ID";
async function createPageInNotionDatabase(title, url, selectedText) {
  const proxyUrl = "https://vercel-proxy-nishanb.vercel.app/api"; // Replace with your Vercel function URL

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://api.notion.com/v1/pages",
      options: {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2021-08-16",
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DATABASE_ID },
          properties: {
            title: { title: [{ text: { content: title } }] },
            url: { url: url },
            selectedText: {
              rich_text: [{ text: { content: selectedText.result } }],
            },
          },
        }),
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Notion API error data:", errorData);
    throw new Error(`Notion API error: ${response.status}`);
  }
}

chrome.contextMenus.create({
  id: "saveSelectedText",
  title: "Save Selected Text to Notion",
  contexts: ["selection"],
});

function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Context menu item clicked"); // Add this line
  if (info.menuItemId === "saveSelectedText") {
    const selectedText = await new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: getSelectedText,
        },
        (results) => resolve(results[0])
      );
    });

    console.log("Selected text:", selectedText); // Add this line

    if (selectedText) {
      try {
        await createPageInNotionDatabase(tab.title, tab.url, selectedText);
        console.log("Selected text saved to Notion successfully.");
      } catch (error) {
        console.error("Error saving selected text to Notion:", error);
        console.log("Error saving selected text to Notion.");
      }
    }
  }
});

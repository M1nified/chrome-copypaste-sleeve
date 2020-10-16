const CM_COPY_ID = 'copyPasteSleeveCopy';
const CM_PASTE_ID = 'copyPasteSleevePaste';
const CM_ADD_CURRENT_URL_ID = 'copyPasteSleeveAddCurrentUrl';

/*
sleeveTextObject {
    text: string,
    name?: string,
}
*/

chrome.runtime.onInstalled.addListener(async () => {
    await populateContextMenus();

    chrome.contextMenus.onClicked.addListener(
        (info, tab) => {
            onContextMenuClick(info, tab);
        }
    );

    setRecordsListener(() => {
        refreshContextMenus();
    });
})

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message)
    if (chrome.runtime.id !== sender.id) return;
    if (message.command === 'add_record') {
        const result = await msgAddRecord(message.record, sender, sendResponse);
        sendResponse(result);
    }
    if (message.command === 'update_record') {
        const result = await msgUpdateRecord(message.record, sender, sendResponse);
        sendResponse(result);
    }
});

const msgAddRecord = async (record, sender, sendResponse) => {
    const { text, name } = record;
    await addRecordToSleeve({
        text,
        name,
    });
    return true;
}

const msgUpdateRecord = async (record, sender, sendResponse) => {
    const { text, name, key } = record;
    await updateRecord({
        text,
        name,
        key,
    });
    return true;
}

const populateContextMenus = async () => {
    chrome.contextMenus.create({
        id: CM_COPY_ID,
        title: 'Copy into Sleeve',
        contexts: [
            'selection',
            'link',
        ],
    })

    chrome.contextMenus.create({
        id: CM_ADD_CURRENT_URL_ID,
        title: 'Add current url to Sleeve',
        contexts: [
            'page_action',
        ],
    })

    chrome.contextMenus.create({
        id: CM_PASTE_ID,
        title: 'Paste from Sleeve',
        contexts: [
            'editable',
        ],
    })
    await populateContextMenuWithPastes();
}

const populateContextMenuWithPastes = async () => {
    const texts = await getAllTexts();
    texts.forEach((record, idx) => {
        const { text, key, name } = record;
        if (!text) return;
        chrome.contextMenus.create({
            id: `${CM_PASTE_ID}${key}`,
            title: name || text,
            contexts: [
                'editable',
            ],
            parentId: CM_PASTE_ID,
        });
    });
}

const refreshContextMenus = async () => {
    chrome.contextMenus.removeAll(() => {
        populateContextMenus();
    });
}

const onContextMenuClick = (info, tab) => {
    const { menuItemId, parentMenuItemId } = info;
    menuItemId === CM_COPY_ID && cmPerformCopy(info, tab);
    menuItemId === CM_ADD_CURRENT_URL_ID && cmPerformAddCurrentUrl(info, tab);
    parentMenuItemId === CM_PASTE_ID && cmPerformPaste(info, tab);
}

const cmPerformCopy = async (info, tab) => {
    const text = info.selectionText || info.linkUrl;
    if (!text) return;
    return addTextToSleeve(text, info, tab);
}

const cmPerformAddCurrentUrl = async (info, tab) => {
    const text = tab.url;
    if (!text) return;
    return addTextToSleeve(text, info, tab);
}

const cmPerformPaste = async (info, tab) => {
    const { menuItemId, editable } = info;
    if (!editable) return;
    const key = getKeyFromMenuItemId(menuItemId);
    const textRecord = await getText(key);
    const { text } = textRecord;
    chrome.tabs.executeScript(tab.id, {
        code: `document.execCommand('insertText', false, '${text}');`,
    });
}

const getKeyFromMenuItemId = menuItemId => {
    const strKey = menuItemId.toString().slice(CM_PASTE_ID.length);
    const key = Number.parseInt(strKey);
    return key;
};

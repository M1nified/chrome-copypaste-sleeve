const addRecordToSleeve = async (record, info, tab) => {
    const { text, name } = record;
    if (!text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const records = await getAllTexts();
        const record = {
            text,
            name,
        }
        records.push(record);
        chrome.storage.sync.set({
            records,
        }, () => {
            // msgTextsUpdated();
            resolve();
        });
    });

}

const addTextToSleeve = async (text, info, tab) => {
    return addRecordToSleeve({ text }, info, tab);
}

const getAllTexts = () => new Promise(async (resolve, reject) => {
    chrome.storage.sync.get('records', ({ records }) => {
        const recordsReady = (Array.isArray(records) ? records : []).map((r, i) => ({ ...r, key: i }));
        resolve(recordsReady);
    })
})

const getText = key => async () => {
    const records = await getAllTexts();
    return (records[key]);
}

const deleteText = key => new Promise(async (resolve, reject) => {
    const records = await getAllTexts();
    records.splice(key, 1);
    chrome.storage.sync.set({ records }, () => {
        // msgTextsUpdated();
        resolve();
    });
})

const updateRecord = (record) => {
    const { text, name, key } = record;
    if (!key || !text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const record = {
            text,
            name,
        }
        const records = await getAllTexts();
        records[key] = record;
        chrome.storage.sync.set({ records }, () => {
            // msgTextsUpdated();
            resolve();
        });
    });
}

const msgTextsUpdated = () => {
    chrome.runtime.sendMessage(
        chrome.runtime.id,
        {
            command: 'texts_updated',
        }
    );
}

const setRecordsListener = (action) => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        if (changes.records) {
            action();
        }
    })
}
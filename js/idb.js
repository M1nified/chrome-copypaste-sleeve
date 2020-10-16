const addRecordToSleeve = async (record, info, tab) => {
    const { text, name } = record;
    if (!text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const key = new Date().getTime().toString() + Math.random().toString().slice(2);
        const record = {
            text,
            name,
            key,
        };
        chrome.storage.sync.set({
            [key]: record,
        }, () => {
            if (!chrome.runtime.lastError) {
                resolve();
            } else {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            }
        });
    });

}

const addTextToSleeve = async (text, info, tab) => {
    return addRecordToSleeve({ text }, info, tab);
}

const getAllTexts = () => new Promise(async (resolve, reject) => {
    chrome.storage.sync.get(recordsObj => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
        }
        const records = Object.keys(recordsObj).map(key => recordsObj[key]);
        resolve(records);
    })
})

const getText = key => new Promise(resolve => {
    chrome.storage.sync.get(key, ({ record }) => {
        if (chrome.runtime.lastError || !record) {
            reject(chrome.runtime.lastError || 'No such record!');
        } else {
            resolve(record);
        }
    })
})

const deleteText = key => new Promise(async (resolve, reject) => {
    chrome.storage.sync.remove(key, () => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.massage);
            reject(chrome.runtime.lastError);
        } else {
            resolve();
        }
    })
})

const updateRecord = (record) => {
    const { text, name, key } = record;
    if (!key || !text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const record = {
            text,
            name,
            key,
        };
        chrome.storage.sync.set({
            [key]: record,
        }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve();
        })
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
        action();
    })
}
const addRecordToSleeve = async (record, info, tab) => {
    const { text, name } = record;
    if (!text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const idb = await openIDB();
        const data = {
            text,
            name,
        }
        const request = idb.transaction(['texts'], 'readwrite')
            .objectStore('texts')
            .put(data);
        request.onerror = event => reject({ error: event });
        request.onsuccess = async event => {
            await refreshContextMenus();
            msgTextsUpdated();
            resolve(true);
        };
    });

}

const addTextToSleeve = async (text, info, tab) => {
    return addRecordToSleeve({ text }, info, tab);
}

const getAllTexts = () => new Promise(async (resolve, reject) => {
    const idb = await openIDB();
    const request = idb.transaction(['texts'])
        .objectStore('texts')
        .openCursor();
    const texts = [];
    request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
            texts.push({
                ...cursor.value,
                key: cursor.key,
            });
            cursor.continue();
        } else {
            resolve(texts);
        }
    };
    request.onerror = event => reject(event);
})

const getText = key => new Promise(async (resolve, reject) => {
    const idb = await openIDB();
    const request = idb.transaction(['texts'])
        .objectStore('texts')
        .get(key);
    request.onsuccess = event => {
        const text = {
            ...event.target.result,
            key,
        };
        resolve(text);
    };
    request.onerror = event => reject(event);
})

const deleteText = key => new Promise(async (resolve, reject) => {
    const idb = await openIDB();
    const request = idb.transaction(['texts'], 'readwrite')
        .objectStore('texts')
        .delete(key);
    request.onsuccess = event => {
        msgTextsUpdated();
        resolve(true);
    };
    request.onerror = event => reject({ error: event });
})

const updateRecord = (record) => {
    const { text, name, key } = record;
    if (!key || !text || typeof text !== 'string') return { error: true };
    return new Promise(async (resolve, reject) => {
        const idb = await openIDB();
        const data = {
            text,
            name,
            key,
        }
        const request = idb.transaction(['texts'], 'readwrite')
            .objectStore('texts')
            .put(data);
        request.onerror = event => reject({ error: event });
        request.onsuccess = async event => {
            await refreshContextMenus();
            msgTextsUpdated();
            resolve(true);
        };
    });
}

const openIDB = async () => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('Sleeve', 1);
        request.onerror = event => reject(event);
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.onerror = event => reject(event);
            const textStore = db.createObjectStore('texts', { keyPath: 'key', autoIncrement: true });
            textStore.createIndex('text', 'text', { unique: false });
        }
    })
}

const msgTextsUpdated = () => {
    chrome.runtime.sendMessage(
        chrome.runtime.id,
        {
            command: 'texts_updated',
        }
    );
}
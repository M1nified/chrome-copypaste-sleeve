window.addEventListener('load', async () => {

    const txtRowTemplateElement = document.querySelector('.tmpl-txt-row').content.firstElementChild;
    const tbody = document.querySelector('.txt-rows');

    const reloadTextsList = async () => {
        const records = await getAllTexts();
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        records.forEach((record, idx) => {
            const { key, text, name } = record;
            const row = txtRowTemplateElement.cloneNode(true);
            const btnDelete = row.querySelector('.btn-text-delete');
            const btnSave = row.querySelector('.btn-text-edit');
            textBox = row.querySelector('.td-text');
            nameBox = row.querySelector('.td-name');

            btnDelete.addEventListener('click', async event => {
                event.preventDefault();
                await deleteText(key);
                tbody.removeChild(row);
            });

            btnSave.addEventListener('click', async event => {
                event.preventDefault();
                const newText = textBox.textContent;
                const newName = nameBox.textContent;
                chrome.runtime.sendMessage(
                    chrome.runtime.id,
                    {
                        command: 'update_record',
                        record: {
                            text: newText,
                            name: newName,
                            key,
                        }
                    }
                )
            })

            row.dataset.key = key;
            textBox.appendChild(document.createTextNode(text));
            nameBox.appendChild(document.createTextNode(name || ''));
            tbody.appendChild(row);
        });
    };

    const formNewText = document.querySelector('.form-new-text');
    formNewText.addEventListener('submit', async event => {
        event.preventDefault();
        const text = event.target.querySelector('.new-text').value;
        const name = event.target.querySelector('.new-name').value;
        if (!text || typeof text !== 'string') {
            console.error('Failed to add new text.', text);
            return;
        }
        chrome.runtime.sendMessage(
            chrome.runtime.id,
            {
                command: 'add_record',
                record: {
                    text,
                    name,
                },
            }
        );
    });

    setRecordsListener(() => {
        reloadTextsList();
    })

    reloadTextsList();

});
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const API_BASE_URL = 'http://localhost:8080/api';
    let fileInput = document.getElementById('fileInput');
    const importBtn = document.getElementById('importBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Import button click handler - always get fresh reference
    importBtn.addEventListener('click', () => {
        const currentFileInput = document.getElementById('fileInput');
        if (currentFileInput) {
            currentFileInput.click();
        }
    });

    // File selection handler - use event delegation to handle dynamically replaced inputs
    function handleFileChange(e) {
        const currentFileInput = e.target;
        processFileImport(currentFileInput);
    }

    fileInput.addEventListener('change', handleFileChange);

    // Function to process file import
    async function processFileImport(fileInputElement) {
        const file = fileInputElement.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xml')) {
            showMessage('Please select an XML file.', 'error');
            fileInputElement.value = '';
            return;
        }

        // Show loading state
        importBtn.disabled = true;
        importBtn.innerHTML = 'Importing...<i class="fa-solid fa-spinner fa-spin"></i>';
        showMessage('Uploading and validating XML file...', 'info');

        try {
            // Read file content first for preview
            const fileContent = await file.text();

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/import`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Show preview popup with XML content and validation results
                showPreviewPopup(fileContent, result);
                // Re-enable import button (file input will be reset when popup closes)
                importBtn.disabled = false;
                importBtn.innerHTML = 'Import Data<i class="fa-solid fa-file-import"></i>';
            } else {
                showMessage('Failed to import file. Please try again.', 'error');
                importBtn.disabled = false;
                importBtn.innerHTML = 'Import Data<i class="fa-solid fa-file-import"></i>';
                fileInputElement.value = '';
            }
        } catch (error) {
            console.error('Import error:', error);
            showMessage('Error connecting to backend. Make sure the server is running on port 8080.', 'error');
            importBtn.disabled = false;
            importBtn.innerHTML = 'Import Data<i class="fa-solid fa-file-import"></i>';
            fileInputElement.value = '';
        }
    }

    // Submit button click handler
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting...<i class="fa-solid fa-spinner fa-spin"></i>';
        showMessage('Submitting data to Excel...', 'info');

        try {
            const response = await fetch(`${API_BASE_URL}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            console.log('Submit response status:', response.status);
            console.log('Submit response body:', result);
            console.log('result.success type:', typeof result.success, 'value:', result.success);

            // Check if submit was successful
            // Backend returns HTTP 200 with success: true on success
            // Or HTTP 200-299 with success field
            if (response.status >= 200 && response.status < 300 && result.success === true) {
                console.log('Submit successful - showing popup');
                const successMessage = result.message || 'Data submitted successfully!';
                showSubmitSuccessPopup(successMessage);
            } else {
                console.log('Submit failed - status:', response.status, 'success:', result.success);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Data<i class="fa-solid fa-paper-plane"></i>';
                showMessage(`✗ ${result.message || 'Failed to submit data.'}`, 'error');
            }
        } catch (error) {
            console.error('Submit error:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Data<i class="fa-solid fa-paper-plane"></i>';
            showMessage('Error connecting to backend. Make sure the server is running on port 8080.', 'error');
        }
    });
}

// Message display function (global)
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    if (!messageArea) {
        console.error('Message area not found!');
        return;
    }

    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    messageArea.innerHTML = `
        <div style="
            padding: 15px 20px;
            border-radius: 8px;
            background-color: ${colors[type] || colors.info};
            color: white;
            font-size: 1rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
            ${message}
        </div>
    `;

    // Auto-hide all messages after a delay (shorter for info, longer for errors)
    const delay = type === 'info' ? 3000 : type === 'error' ? 5000 : 4000;
    setTimeout(() => {
        if (messageArea.innerHTML.includes(message)) {
            messageArea.innerHTML = '';
        }
    }, delay);
}

// Preview popup function (global)
function showPreviewPopup(xmlContent, validationResult) {
    const popup = document.getElementById('previewPopup');
    const overlay = document.getElementById('popupOverlay');
    const xmlDataElement = document.getElementById('previewXmlData');
    const validationErrorsElement = document.getElementById('previewValidationErrors');
    const confirmBtn = document.getElementById('confirmImportBtn');
    const closeBtn = document.getElementById('closePreviewBtn');

    if (!popup || !overlay || !xmlDataElement || !validationErrorsElement) {
        console.error('Preview popup elements not found!');
        return;
    }

    // Format and display XML content
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        const formattedXml = formatXML(xmlContent);
        xmlDataElement.textContent = formattedXml;
    } catch (error) {
        xmlDataElement.textContent = xmlContent;
    }

    // Display validation results
    validationErrorsElement.innerHTML = '';

    const hasErrors = validationResult.errors && validationResult.errors.length > 0;
    const hasValidRecords = validationResult.validRecordsCount > 0;
    const hasInvalidRecords = validationResult.invalidRecordsCount > 0;

    // Show summary
    if (hasValidRecords) {
        const successDiv = document.createElement('div');
        successDiv.className = 'validation-success';
        successDiv.innerHTML = `<strong>✓ Valid Records:</strong> ${validationResult.validRecordsCount}`;
        validationErrorsElement.appendChild(successDiv);
    }

    if (hasInvalidRecords) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'validation-error highlight';
        warningDiv.innerHTML = `<strong>⚠ Invalid Records:</strong> ${validationResult.invalidRecordsCount}`;
        validationErrorsElement.appendChild(warningDiv);
    }

    // Show individual errors
    if (hasErrors) {
        validationResult.errors.forEach((error, index) => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error highlight';
            errorDiv.innerHTML = `<strong>Error ${index + 1}:</strong> ${error}`;
            validationErrorsElement.appendChild(errorDiv);
        });
    }

    // Enable/disable confirm button based on validation
    if (hasValidRecords) {
        confirmBtn.disabled = false;
        confirmBtn.onclick = () => confirmImport(validationResult);
    } else {
        confirmBtn.disabled = true;
        confirmBtn.onclick = null;
    }

    // Show popup
    overlay.classList.add('show');
    popup.classList.add('show');
    popup.classList.remove('hide');

    // Close function
    const closePopup = () => {
        popup.classList.remove('show');
        popup.classList.add('hide');
        overlay.classList.remove('show');
        overlay.removeEventListener('click', closePopup);
        closeBtn.removeEventListener('click', closePopup);

        // Refresh page when canceling without confirming
        window.location.reload();
    };

    // Close on overlay click
    overlay.addEventListener('click', closePopup);

    // Close on close button click
    closeBtn.addEventListener('click', closePopup);
}

// Format XML for better readability
function formatXML(xmlString) {
    try {
        // Simple XML formatting
        let formatted = '';
        let indent = 0;
        const tab = '  ';
        const regex = /(>)(<)(\/*)/g;
        const xml = xmlString.replace(regex, '$1\r\n$2$3');
        const parts = xml.split('\r\n');

        parts.forEach((node) => {
            if (!node) return;

            const indentString = tab.repeat(indent);
            if (node.match(/.+<\/\w[^>]*>$/)) {
                formatted += indentString + node + '\r\n';
            } else if (node.match(/^<\/\w/) && indent > 0) {
                indent--;
                formatted += tab.repeat(indent) + node + '\r\n';
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                formatted += indentString + node + '\r\n';
                indent++;
            } else {
                formatted += indentString + node + '\r\n';
            }
        });

        return formatted.trim();
    } catch (error) {
        return xmlString;
    }
}

// Confirm import function
async function confirmImport(validationResult) {
    const confirmBtn = document.getElementById('confirmImportBtn');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = 'Importing...<i class="fa-solid fa-spinner fa-spin"></i>';

    // Records are already stored in backend session during import
    // Just close preview and show confirmation
    setTimeout(() => {
        closePreviewPopup();
        showConfirmPopup();
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Confirm Import<i class="fa-solid fa-arrow-right"></i>';
    }, 300);
}

// Close preview popup function
function closePreviewPopup() {
    const popup = document.getElementById('previewPopup');
    const overlay = document.getElementById('popupOverlay');

    if (popup && overlay) {
        popup.classList.remove('show');
        popup.classList.add('hide');
        overlay.classList.remove('show');
    }

    // Reset file input to allow re-selecting files
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
        // Ensure browser processes the reset
        setTimeout(() => {
            fileInput.value = '';
        }, 10);
    }

    // Ensure import button is enabled
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.disabled = false;
        importBtn.innerHTML = 'Import Data<i class="fa-solid fa-file-import"></i>';
    }
}

// Show confirm popup function
function showConfirmPopup() {
    const popup = document.getElementById('confirmPopup');
    const overlay = document.getElementById('confirmPopupOverlay');
    const okBtn = document.getElementById('okBtn');

    if (!popup || !overlay || !okBtn) {
        console.error('Confirm popup elements not found!');
        return;
    }

    // Show popup
    overlay.classList.add('show');
    popup.classList.add('show');
    popup.classList.remove('hide');

    // Close function
    const closePopup = () => {
        popup.classList.remove('show');
        popup.classList.add('hide');
        overlay.classList.remove('show');
        overlay.removeEventListener('click', closePopup);
        okBtn.removeEventListener('click', closePopup);

        // Refresh page after clicking OK
        window.location.reload();
    };

    // Close on overlay click
    overlay.addEventListener('click', closePopup);

    // Close on OK button click
    okBtn.addEventListener('click', closePopup);
}

// Show submit success popup function
function showSubmitSuccessPopup(message) {
    console.log('showSubmitSuccessPopup called with message:', message);

    // Reset submit button first
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Data<i class="fa-solid fa-paper-plane"></i>';
    }

    const popup = document.getElementById('submitSuccessPopup');
    const overlay = document.getElementById('submitSuccessPopupOverlay');
    const okBtn = document.getElementById('submitOkBtn');
    const messageElement = document.getElementById('submitSuccessMessage');

    console.log('Popup elements check:', {
        popup: !!popup,
        overlay: !!overlay,
        okBtn: !!okBtn,
        messageElement: !!messageElement
    });

    if (!popup || !overlay || !okBtn || !messageElement) {
        console.error('Submit success popup elements not found!', {
            popup: popup,
            overlay: overlay,
            okBtn: okBtn,
            messageElement: messageElement
        });
        // Fallback to message
        showMessage(`✓ ${message}`, 'success');
        return;
    }

    // Set the message
    messageElement.textContent = message;

    // Remove hide class first
    popup.classList.remove('hide');
    overlay.classList.remove('hide');

    // Show popup - ensure visibility is set
    overlay.style.visibility = 'visible';
    popup.style.visibility = 'visible';

    // Force a reflow to ensure styles are applied before transition
    void popup.offsetHeight;
    void overlay.offsetHeight;

    // Add show class after visibility is set and reflow is forced
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        popup.classList.add('show');
        console.log('Popup should now be visible');
    });

    // Close function - only refresh after OK click
    const closePopup = () => {
        console.log('Closing submit success popup');
        popup.classList.remove('show');
        popup.classList.add('hide');
        overlay.classList.remove('show');
        overlay.classList.add('hide');

        setTimeout(() => {
            overlay.style.visibility = 'hidden';
            popup.style.visibility = 'hidden';
            // Refresh page ONLY after OK button is clicked
            window.location.reload();
        }, 300);
    };

    // Remove old listeners by cloning buttons
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    // Get fresh overlay reference after potential DOM changes
    const currentOverlay = document.getElementById('submitSuccessPopupOverlay');

    // Close on overlay click
    if (currentOverlay) {
        currentOverlay.addEventListener('click', closePopup);
    }

    // Close on OK button click
    newOkBtn.addEventListener('click', closePopup);
}

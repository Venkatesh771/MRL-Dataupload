// Global variable to store imported data
let storedImportData = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const API_BASE_URL = 'http://localhost:8080/api';
    const fileInput = document.getElementById('fileInput');
    const importBtn = document.getElementById('importBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Import button click handler
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection handler
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xml')) {
            alert('Please select an XML file.');
            fileInput.value = '';
            return;
        }

        // Show loading state
        importBtn.disabled = true;
        importBtn.innerHTML = 'Importing...<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/import`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();

            // Basic validation: check if data exists and is not empty
            if (result && result.validRecords && result.validRecords.length > 0) {
                storedImportData = result;
                alert('Imported successfully');
            } else {
                alert('No valid data found in the file.');
            }
        } catch (error) {
            console.error('Import error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert('Cannot connect to backend server. Please make sure the backend server is running on port 8080.\n\nTo start the server:\n1. Navigate to mrl-backend folder\n2. Run: mvn spring-boot:run\n\nOr start it from your IDE.');
            } else if (error.message.includes('status')) {
                alert(`Server error: ${error.message}`);
            } else {
                alert('Error importing file. Please check the console for details.');
            }
        } finally {
            // Reset import button
            importBtn.disabled = false;
            importBtn.innerHTML = 'Import Data<i class="fa-solid fa-file-import"></i>';
            fileInput.value = '';
        }
    });

    // Submit button click handler
    submitBtn.addEventListener('click', async () => {
        // Basic validation: check if data exists and is not empty
        if (!storedImportData) {
            alert('No data to submit. Please import a file first.');
            return;
        }

        const validRecords = storedImportData.validRecords || [];
        if (validRecords.length === 0) {
            alert('No valid data to submit. Please import a file first.');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting...<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`${API_BASE_URL}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success === true) {
                alert('Submitted successfully');
                // Clear stored data after successful submission
                storedImportData = null;
            } else {
                alert(`Failed to submit data: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert('Cannot connect to backend server. Please make sure the backend server is running on port 8080.\n\nTo start the server:\n1. Navigate to mrl-backend folder\n2. Run: mvn spring-boot:run\n\nOr start it from your IDE.');
            } else if (error.message.includes('status')) {
                alert(`Server error: ${error.message}`);
            } else {
                alert('Error submitting data. Please check the console for details.');
            }
        } finally {
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Data<i class="fa-solid fa-paper-plane"></i>';
        }
    });
}


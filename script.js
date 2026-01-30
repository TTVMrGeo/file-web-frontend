document.addEventListener('DOMContentLoaded', function() {
    // Configuration - MUST UPDATE THESE FOR DEPLOYMENT
    const CONFIG = {
        // Your Railway backend URL (REQUIRED - update this!)
        BACKEND_URL: 'https://your-project-name.up.railway.app',
        
        // Your file name (update to match your actual file)
        FILE_NAME: 'Valuable-Resource.pdf',
        
        // Display names (can customize)
        FILE_DISPLAY_NAME: 'Valuable Resource',
        FILE_SIZE: '1.5 MB',
        
        // Timeouts (in milliseconds)
        API_TIMEOUT: 10000, // 10 seconds
        SUCCESS_MESSAGE_DURATION: 5000, // 5 seconds
        ERROR_MESSAGE_DURATION: 5000 // 5 seconds
    };
    
    // DOM Elements
    const elements = {
        form: {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email')
        },
        messages: {
            firstName: document.getElementById('firstNameMessage'),
            lastName: document.getElementById('lastNameMessage'),
            email: document.getElementById('emailMessage'),
            status: document.getElementById('statusMessage'),
            success: document.getElementById('successMessage'),
            successText: document.getElementById('successText'),
            error: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText')
        },
        buttons: {
            download: document.getElementById('downloadBtn')
        },
        display: {
            fileName: document.getElementById('fileNameDisplay'),
            fileSize: document.getElementById('fileSizeDisplay'),
            currentYear: document.getElementById('currentYear')
        }
    };
    
    // Initialize
    init();
    
    // Functions
    function init() {
        // Set current year in footer
        if (elements.display.currentYear) {
            elements.display.currentYear.textContent = new Date().getFullYear();
        }
        
        // Set file display names
        if (elements.display.fileName) {
            elements.display.fileName.textContent = CONFIG.FILE_DISPLAY_NAME;
        }
        if (elements.display.fileSize) {
            elements.display.fileSize.textContent = CONFIG.FILE_SIZE;
        }
        
        // Set button text
        updateButtonText();
        
        // Add event listeners
        setupEventListeners();
        
        // Log configuration (for debugging)
        console.log('Frontend initialized with config:', {
            backendUrl: CONFIG.BACKEND_URL,
            fileName: CONFIG.FILE_NAME,
            apiTimeout: CONFIG.API_TIMEOUT
        });
        
        // Check backend connectivity
        checkBackendHealth();
    }
    
    function setupEventListeners() {
        // Form input validation
        Object.values(elements.form).forEach(input => {
            input.addEventListener('input', validateForm);
            input.addEventListener('blur', validateField);
        });
        
        // Download button
        elements.buttons.download.addEventListener('click', processDownload);
        
        // Enter key support
        document.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !elements.buttons.download.disabled) {
                elements.buttons.download.click();
            }
        });
    }
    
    // Validation Functions
    function validateField(event) {
        const input = event.target;
        const value = input.value.trim();
        
        if (input.id === 'email') {
            validateEmail(value, input);
        } else if (input.id === 'firstName' || input.id === 'lastName') {
            validateName(value, input);
        }
        
        validateForm();
    }
    
    function validateForm() {
        const isValid = 
            validateName(elements.form.firstName.value.trim(), elements.form.firstName) &&
            validateName(elements.form.lastName.value.trim(), elements.form.lastName) &&
            validateEmail(elements.form.email.value.trim(), elements.form.email);
        
        elements.buttons.download.disabled = !isValid;
        updateButtonText();
        
        return isValid;
    }
    
    function validateName(value, input) {
        const messageElement = elements.messages[input.id];
        
        if (!value) {
            showValidation(input, messageElement, 'This field is required', false);
            return false;
        }
        
        if (value.length < 2) {
            showValidation(input, messageElement, 'Must be at least 2 characters', false);
            return false;
        }
        
        showValidation(input, messageElement, 'Looks good!', true);
        return true;
    }
    
    function validateEmail(value, input) {
        const messageElement = elements.messages.email;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!value) {
            showValidation(input, messageElement, 'Email is required', false);
            return false;
        }
        
        if (!emailRegex.test(value)) {
            showValidation(input, messageElement, 'Please enter a valid email', false);
            return false;
        }
        
        showValidation(input, messageElement, 'Valid email', true);
        return true;
    }
    
    function showValidation(input, messageElement, text, isValid) {
        input.classList.remove('valid', 'invalid');
        input.classList.add(isValid ? 'valid' : 'invalid');
        
        messageElement.innerHTML = `<i class="fas fa-${isValid ? 'check' : 'exclamation'}-circle"></i> ${text}`;
        messageElement.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
    }
    
    // Main Download Process
    async function processDownload() {
        if (!validateForm()) {
            showError('Please fix the errors in the form');
            return;
        }
        
        // Get form data
        const formData = {
            email: elements.form.email.value.trim(),
            firstName: elements.form.firstName.value.trim(),
            lastName: elements.form.lastName.value.trim()
        };
        
        // Show loading state
        showLoading(true);
        hideMessages();
        
        try {
            // Step 1: Create contact in SendFox via backend
            const contactResult = await createContact(formData);
            
            if (contactResult.success) {
                // Step 2: Show success and download file
                showSuccess('Contact added successfully! Starting download...');
                
                // Small delay for better UX
                setTimeout(() => {
                    downloadFile();
                    showSuccess(`Download started! Check your downloads folder for "${CONFIG.FILE_DISPLAY_NAME}"`);
                }, 1000);
                
                // Reset form after delay
                setTimeout(() => {
                    resetForm();
                    showLoading(false);
                }, CONFIG.SUCCESS_MESSAGE_DURATION);
                
            } else {
                throw new Error(contactResult.message || 'Failed to process your request');
            }
            
        } catch (error) {
            showLoading(false);
            showError(error.message);
            
            // Auto-hide error after duration
            setTimeout(() => {
                hideMessages();
            }, CONFIG.ERROR_MESSAGE_DURATION);
        }
    }
    
    // API Functions
    async function createContact(formData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/api/create-contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Couldn't parse JSON error
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Please check your internet connection.');
            }
            
            throw error;
        }
    }
    
    async function checkBackendHealth() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/api/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                console.log('Backend health check: OK');
            } else {
                console.warn('Backend health check: Failed', response.status);
            }
        } catch (error) {
            console.warn('Backend health check: Cannot connect', error.message);
        }
    }
    
    // File Download
    function downloadFile() {
        try {
            // Option A: Download from backend (recommended for larger files)
            // window.location.href = `${CONFIG.BACKEND_URL}/files/${CONFIG.FILE_NAME}`;
            
            // Option B: Download from same origin (file must be in GitHub Pages repo)
            const link = document.createElement('a');
            link.href = CONFIG.FILE_NAME;
            link.download = CONFIG.FILE_NAME;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Log download attempt
            console.log('Download initiated for:', CONFIG.FILE_NAME);
            
        } catch (error) {
            console.error('Download failed:', error);
            showError('Download failed. Please try again or contact support.');
        }
    }
    
    // UI Helper Functions
    function showLoading(show) {
        if (show) {
            elements.messages.status.classList.add('show');
            elements.buttons.download.disabled = true;
            elements.buttons.download.classList.add('pulsing');
        } else {
            elements.messages.status.classList.remove('show');
            elements.buttons.download.classList.remove('pulsing');
        }
    }
    
    function showSuccess(message) {
        elements.messages.successText.textContent = message;
        elements.messages.success.classList.add('show');
        elements.messages.error.classList.remove('show');
    }
    
    function showError(message) {
        elements.messages.errorText.textContent = message;
        elements.messages.error.classList.add('show');
        elements.messages.success.classList.remove('show');
    }
    
    function hideMessages() {
        elements.messages.status.classList.remove('show');
        elements.messages.success.classList.remove('show');
        elements.messages.error.classList.remove('show');
    }
    
    function updateButtonText() {
        const isDisabled = elements.buttons.download.disabled;
        elements.buttons.download.innerHTML = isDisabled
            ? '<i class="fas fa-download"></i> Download File'
            : `<i class="fas fa-download"></i> Download ${CONFIG.FILE_DISPLAY_NAME}`;
    }
    
    function resetForm() {
        // Clear form values
        Object.values(elements.form).forEach(input => {
            input.value = '';
            input.classList.remove('valid', 'invalid');
        });
        
        // Clear messages
        Object.values(elements.messages).forEach(message => {
            if (message.classList && message !== elements.messages.successText && message !== elements.messages.errorText) {
                message.textContent = '';
                message.className = 'validation-message';
            }
        });
        
        // Reset button
        elements.buttons.download.disabled = true;
        updateButtonText();
        
        // Hide all status messages
        hideMessages();
        
        // Focus on first field
        elements.form.firstName.focus();
    }
    
    // Make config available globally for debugging
    window.appConfig = CONFIG;
});
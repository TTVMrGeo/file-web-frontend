document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Messages
    const firstNameMessage = document.getElementById('firstNameMessage');
    const lastNameMessage = document.getElementById('lastNameMessage');
    const emailMessage = document.getElementById('emailMessage');
    const statusMessage = document.getElementById('statusMessage');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    // Configuration - UPDATE THESE FOR DEPLOYMENT
    const BACKEND_URL = 'https://your-backend-url.herokuapp.com'; // CHANGE THIS
    const FILE_NAME = 'your-file.pdf'; // CHANGE THIS to your actual file
    
    // Email validation regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Add event listeners to form inputs
    firstNameInput.addEventListener('input', validateForm);
    lastNameInput.addEventListener('input', validateForm);
    emailInput.addEventListener('input', validateForm);
    
    // Download file when button is clicked
    downloadBtn.addEventListener('click', function() {
        processAndDownload();
    });
    
    // Function to validate the entire form
    function validateForm() {
        let isValid = true;
        
        // Validate first name
        const firstName = firstNameInput.value.trim();
        if (firstName === '' || firstName.length < 2) {
            markInvalid(firstNameInput, firstNameMessage, 'First name must be at least 2 characters');
            isValid = false;
        } else {
            markValid(firstNameInput, firstNameMessage);
        }
        
        // Validate last name
        const lastName = lastNameInput.value.trim();
        if (lastName === '' || lastName.length < 2) {
            markInvalid(lastNameInput, lastNameMessage, 'Last name must be at least 2 characters');
            isValid = false;
        } else {
            markValid(lastNameInput, lastNameMessage);
        }
        
        // Validate email
        const email = emailInput.value.trim();
        if (email === '' || !emailRegex.test(email)) {
            markInvalid(emailInput, emailMessage, 'Please enter a valid email address');
            isValid = false;
        } else {
            markValid(emailInput, emailMessage, 'Valid email format');
        }
        
        // Update download button state
        downloadBtn.disabled = !isValid;
        downloadBtn.innerHTML = isValid 
            ? `<i class="fas fa-download"></i> Download ${FILE_NAME}`
            : '<i class="fas fa-download"></i> Download File';
        
        return isValid;
    }
    
    // Function to process form and download file
    async function processAndDownload() {
        if (!validateForm()) {
            showError('Please fill in all fields correctly.');
            return;
        }
        
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        
        // Hide any previous messages
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');
        
        // Show processing status
        statusMessage.classList.add('show');
        downloadBtn.disabled = true;
        downloadBtn.classList.add('pulsing');
        
        try {
            // Step 1: Call backend to create contact in SendFox
            const contactResult = await callBackend(email, firstName, lastName);
            
            if (contactResult.success) {
                successText.textContent = `Contact added successfully! Downloading ${FILE_NAME}...`;
                successMessage.classList.add('show');
                statusMessage.classList.remove('show');
                
                // Step 2: Download the file
                setTimeout(() => {
                    downloadFile(FILE_NAME);
                }, 1000);
                
                // Reset form after 5 seconds
                setTimeout(() => {
                    resetForm();
                }, 5000);
            } else {
                throw new Error(contactResult.message || 'Failed to create contact');
            }
        } catch (error) {
            showError(error.message);
            statusMessage.classList.remove('show');
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('pulsing');
        }
    }
    
    // Function to call backend API
    async function callBackend(email, firstName, lastName) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/create-sendfox-contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    firstName: firstName,
                    lastName: lastName
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error calling backend:', error);
            throw new Error('Failed to connect to the server. Please try again.');
        }
    }
    
    // Function to download file
    function downloadFile(filename) {
        // Option 1: If file is hosted on GitHub Pages
        // const fileUrl = `https://your-username.github.io/your-repo/${filename}`;
        
        // Option 2: If file is hosted on backend
        const fileUrl = `${BACKEND_URL}/files/${filename}`;
        
        // Option 3: If file is in the same repo (for GitHub Pages)
        const link = document.createElement('a');
        link.href = filename;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update success message
        setTimeout(() => {
            successText.textContent = `Contact added and ${filename} downloaded successfully!`;
        }, 500);
    }
    
    // Helper functions
    function markValid(input, messageElement, text = 'Valid') {
        input.classList.remove('invalid');
        input.classList.add('valid');
        messageElement.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
        messageElement.className = 'validation-message valid';
    }
    
    function markInvalid(input, messageElement, text) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        messageElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${text}`;
        messageElement.className = 'validation-message invalid';
    }
    
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 5000);
    }
    
    function resetForm() {
        firstNameInput.value = '';
        lastNameInput.value = '';
        emailInput.value = '';
        
        [firstNameInput, lastNameInput, emailInput].forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
        
        [firstNameMessage, lastNameMessage, emailMessage].forEach(msg => {
            msg.textContent = '';
        });
        
        successMessage.classList.remove('show');
        downloadBtn.disabled = true;
        downloadBtn.classList.remove('pulsing');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download File';
    }
});
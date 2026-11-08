document.addEventListener("DOMContentLoaded", () => {
    
    // --- Theme Toggle Logic ---
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const htmlElement = document.documentElement;

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            htmlElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
        }
    });

    // --- Form Submission & Security Logic ---
    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Honeypot Verification
        const honeypot = document.getElementById('bot_field').value;
        if (honeypot !== "") {
            console.log("Bot detected by honeypot. Discarding submission quietly.");
            return;
        }

        // 2. Gather Data
        const formData = new FormData();
        formData.append('fullName', document.getElementById('fullName').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('instituteId', document.getElementById('instituteId').value);
        formData.append('size', document.querySelector('input[name="size"]:checked').value);
        formData.append('transactionId', document.getElementById('transactionId').value);
        
        // Append optional files only if they exist (prevents errors if missing)
        const paymentFile = document.getElementById('paymentUpload').files[0];
        if (paymentFile) formData.append('payment', paymentFile);

        // 3. Execute Google reCAPTCHA v3, then send to backend
        // REPLACE 'YOUR_SITE_KEY' WITH YOUR ACTUAL GOOGLE SITE KEY
        grecaptcha.ready(function() {
            grecaptcha.execute('YOUR_SITE_KEY', {action: 'register'}).then(function(token) {
                
                // Append the generated Google token to the form data
                formData.append('captchaToken', token);

                // 4. Send to Backend API
                fetch('/api/register', {
                    method: 'POST',
                    body: formData // Content-Type is set automatically by the browser for FormData
                })
                .then(response => {
                    if (!response.ok) throw new Error("Security check failed on server");
                    return response.json();
                })
                .then(data => {
                    alert("Registration Successful!");
                    // Optional: document.getElementById('registrationForm').reset();
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("Registration failed. Please try again.");
                });
            });
        });
    });
});

// --- Image Preview Logic ---
window.previewImage = function(event, previewElementId) {
    const input = event.target;
    const previewImage = document.getElementById(previewElementId);
    const placeholder = input.nextElementSibling; 

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            setTimeout(() => {
                previewImage.style.opacity = '1';
                placeholder.style.opacity = '0'; 
            }, 50);
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        previewImage.src = "";
        previewImage.style.opacity = '0';
        setTimeout(() => previewImage.style.display = 'none', 400);
        placeholder.style.opacity = '1';
    }
};
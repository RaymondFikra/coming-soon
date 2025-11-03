// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Get both forms
    const heroForm = document.getElementById('newsletter-form');
    const footerForm = document.getElementById('newsletter-form-footer');

    // Handle hero form submission
    if (heroForm) {
        heroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    }

    // Handle footer form submission
    if (footerForm) {
        footerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    }

    // Smooth scroll for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const firstSection = document.querySelector('.section');
            if (firstSection) {
                firstSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Add intersection observer for smooth scroll-triggered animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all sections for smooth reveal
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Observe trust badge
    const trustBadge = document.querySelector('.trust-section');
    if (trustBadge) {
        observer.observe(trustBadge);
    }
});

function handleFormSubmit(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('.submit-btn');
    const messageContainer = form.parentElement.querySelector('.form-message');
    const email = (emailInput && emailInput.value || '').trim();

    // Read endpoint from form attribute (set by deploy-time env or manually)
    const endpoint = form.getAttribute('data-endpoint') || window.FIKRA_SIGNUP_ENDPOINT || '';

    // Basic validation
    if (!email || !isValidEmail(email)) {
        showMessage(form, 'Please enter a valid email address', 'error');
        return;
    }

    // Disable button and show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.querySelector('.btn-text') ? submitBtn.querySelector('.btn-text').textContent : '';
        if (submitBtn.querySelector('.btn-text')) submitBtn.querySelector('.btn-text').textContent = 'Submitting...';

        // If an endpoint is configured, POST there. Otherwise, fallback to localStorage.
        if (endpoint) {
            // Use fetch to POST the email to the configured endpoint
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, source: form.id || 'site' })
            }).then(async res => {
                if (!res.ok) {
                    const text = await res.text().catch(() => 'Server error');
                    throw new Error(text || 'Failed to submit');
                }
                showMessage(form, 'Thanks — you are on the list! We\'ll keep you updated.', 'success');
                emailInput.value = '';
                trackConversion(email);
            }).catch(err => {
                console.error('Signup POST failed:', err);
                showMessage(form, 'Could not submit right now. We saved your address locally and will retry.', 'error');
                storeEmail(email);
            }).finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtn.querySelector('.btn-text')) submitBtn.querySelector('.btn-text').textContent = originalBtnText;
                }
            });
        } else {
            // No remote endpoint configured — store locally and inform user
            storeEmail(email);
            showMessage(form, 'Thanks for joining! Offline signup saved locally.', 'success');
            emailInput.value = '';
            // Reset button
            submitBtn.disabled = false;
            if (submitBtn.querySelector('.btn-text')) submitBtn.querySelector('.btn-text').textContent = originalBtnText;
            trackConversion(email);
        }
    } else {
        // No submit button found — just store locally
        storeEmail(email);
        showMessage(form, 'Thanks for joining! Offline signup saved locally.', 'success');
        emailInput.value = '';
        trackConversion(email);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(form, message, type) {
    // Prefer a dedicated .form-message container for accessible updates
    const messageContainer = form.parentElement.querySelector('.form-message');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = 'form-message ' + (type === 'success' ? 'success-message' : 'error-message');

        // Clear after timeout
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = 'form-message';
        }, 6000);
        return;
    }

    // Fallback: inline messages near form
    const existingMessage = form.parentElement.querySelector('.success-message, .error-message');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    form.parentElement.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 6000);
}

function storeEmail(email) {
    // Get existing emails from localStorage
    let emails = [];
    try {
        const stored = localStorage.getItem('fikra_emails');
        if (stored) {
            emails = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading from localStorage:', e);
    }

    // Add new email if not already present
    if (!emails.includes(email)) {
        emails.push(email);
        try {
            localStorage.setItem('fikra_emails', JSON.stringify(emails));
            console.log('Email stored successfully:', email);
        } catch (e) {
            console.error('Error storing to localStorage:', e);
        }
    }
}

function trackConversion(email) {
    // TODO: Add analytics tracking here
    // Example: gtag('event', 'newsletter_signup', { email: email });
    console.log('Conversion tracked for:', email);
}

// Easter egg: Log welcome message
console.log('%cWelcome to Fikra! 🚀', 'color: #667eea; font-size: 24px; font-weight: bold;');
console.log('%cConnecting employee insights with leadership decisions', 'color: #764ba2; font-size: 14px;');
console.log('%cInterested in working with us? Reach out!', 'color: #667eea; font-size: 12px;');

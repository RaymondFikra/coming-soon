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

    // Add intersection observer for fade-in animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

function handleFormSubmit(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('.submit-btn');
    const email = emailInput.value;

    // Basic validation
    if (!email || !isValidEmail(email)) {
        showMessage(form, 'Please enter a valid email address', 'error');
        return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.querySelector('.btn-text').textContent = 'Submitting...';

    // Store email in localStorage for now
    // TODO: Replace with actual backend API call
    storeEmail(email);

    // Simulate API call
    setTimeout(() => {
        // Show success message
        showMessage(form, 'Thanks for joining! We\'ll keep you updated.', 'success');

        // Reset form
        emailInput.value = '';

        // Reset button
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = originalBtnText;

        // Track conversion (for analytics)
        trackConversion(email);
    }, 1000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(form, message, type) {
    // Remove any existing messages
    const existingMessage = form.parentElement.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;

    // Add message after form
    form.parentElement.appendChild(messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
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

// Add parallax effect to hero section
document.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        hero.style.transform = `translate3d(0, ${rate}px, 0)`;
    }
});

// Easter egg: Log welcome message
console.log('%cWelcome to Fikra! 🚀', 'color: #667eea; font-size: 24px; font-weight: bold;');
console.log('%cConnecting employee insights with leadership decisions', 'color: #764ba2; font-size: 14px;');
console.log('%cInterested in working with us? Reach out!', 'color: #667eea; font-size: 12px;');

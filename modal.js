// Function to show modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Function to close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('open-login-modal').addEventListener('click', function() {
    showModal('login-modal');
});

document.getElementById('open-register-modal').addEventListener('click', function() {
    showModal('register-modal');
});

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal('login-modal');
        closeModal('register-modal');
    }
});

// Close modal when clicking on close button
document.querySelectorAll('.close-modal').forEach(closeButton => {
    closeButton.addEventListener('click', function() {
        const modalId = closeButton.getAttribute('data-modal');
        closeModal(modalId);
    });
});

// Switch between login and register modals
document.querySelectorAll('.switch-to-login, .switch-to-register').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        if (link.classList.contains('switch-to-login')) {
            closeModal('register-modal');
            showModal('login-modal');
        } else {
            closeModal('login-modal');
            showModal('register-modal');
        }
    });
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const loginType = document.querySelector('input[name="login-type"]:checked').value;
    const credential = document.getElementById('login-credential').value;
    const password = document.getElementById('password').value;


    // Dynamically get the input value based on login type
    if (loginType === 'username') {
        console.log('Login attempt with username:', credential, password);
        // Send username and password to server for authentication
    } else {
        console.log('Login attempt with email:', credential, password);
        // Send email and password to server for authentication
    }

});

// Handle register form submission
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const nickname = document.getElementById('register-nickname').value;
    const password = document.getElementById('register-password').value;
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;

    console.log('Register attempt with:', email, nickname, password, firstName, lastName, gender, age);
});

document.querySelectorAll('input[name="login-type"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const credentialInput = document.getElementById('login-credential');
        if (this.value === 'username') {
            credentialInput.placeholder = 'Username';
        } else {
            credentialInput.placeholder = 'Email';
        }
    });
});

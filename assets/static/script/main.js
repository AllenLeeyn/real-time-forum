document.getElementById('signUpSubmit').onclick = signUpSubmition;
document.getElementById('logInSubmit').onclick = logInSubmition;
document.getElementById('toLogIn').onclick = toggleView;
document.getElementById('toSignUp').onclick = toggleView;

const VALIDATION_VIEW = document.getElementById("validationView")
const SIGNUP_VIEW = document.getElementById("signUpFormContainer")
const LOGIN_VIEW = document.getElementById("logInFormContainer")
const MAIN_VIEW = document.getElementById("mainView")

let validSession = false;
let currentView = SIGNUP_VIEW

/*------ view functions ------*/
function toggleView(event){
  const clickedId = event.target.id;

  if (clickedId === 'toLogIn') {
    currentView = LOGIN_VIEW;

  } else if (clickedId === 'toSignUp') {
    currentView = SIGNUP_VIEW;
  }
  renderView();
}

function renderView(){
  VALIDATION_VIEW.style.display = 'none';
  SIGNUP_VIEW.style.display = 'none';
  LOGIN_VIEW.style.display = 'none';
  MAIN_VIEW.style.display = 'none';

  if (currentView === LOGIN_VIEW) {
    VALIDATION_VIEW.style.display = 'block';
    LOGIN_VIEW.style.display = 'block';

  } else if (currentView === SIGNUP_VIEW) {
    VALIDATION_VIEW.style.display = 'block';
    SIGNUP_VIEW.style.display = 'block';

  } else if (currentView === MAIN_VIEW) {
    MAIN_VIEW.style.display = 'block';
  }
}

/*------ Authentication functions ------*/
function signUpSubmition(event){
  event.preventDefault();
  const form = document.getElementById('signUpForm');
  const formData = new FormData(form);

  const userFirstName = formData.get('firstName');
  const userLastName = formData.get('lastName');
  const userNickname = formData.get('nickName');
  const gender = formData.get('gender');
  const age = formData.get('age');
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm-password');

  // Validate username
  if (!isValidName("First Name", userFirstName)) return;
  if (!isValidName("Last Name", userLastName)) return;
  if (!isValidName("Nickname", userNickname)) return;

  // Validate gender (check if one of the radio buttons is selected and its value is valid)
  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    return showMessage("Please select a valid gender (Male, Female, or Other).");
  }

  // validate age
  if (isNaN(age) || age < 9 || age > 100) {
    return showMessage("Please enter a valid age between 9 and 100.");
  }

  // Validate email
  if (email.trim() === "") {
    return showMessage("Email is required.");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return showMessage("Please enter a valid email address.");
  }

  // Validate password
  if (password.trim() === "") {
    return showMessage("Password is required.");
  } else if (password.length <= 7) {
    return showMessage("Password must be at least 8 characters long.");
  } else if (password.toLowerCase() === "password") {
    return showMessage("Password cannot be 'password'.");
  }
  if (confirmPassword.trim() === "" || password !== confirmPassword){
    return showMessage("Passwords do not match.");
  }

  const jsonData = {
    firstName: userFirstName,
    lastName: userLastName,
    nickName: userNickname,
    gender: gender,
    age: age,
    email: email,
    password: password,
    confirmPassword: confirmPassword,
  };

  fetch('/signup',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(jsonData),
  })
  .then(response => {
    if (response.ok){
      validSession = true;
      showMessage("Signup successful!");
      currentView = MAIN_VIEW;
      toggleView(event);
    } else{
      return response.json().then(errorData => {
        showMessage(errorData.message);
      });
    }
  })
  .catch(error =>{
    console.error("Error:", error);
    showMessage("An error occurred. Please check your connection.");
  });
};

function logInSubmition(event){
  event.preventDefault();
  const form = document.getElementById('logInForm');
  const formData = new FormData(form);

  const userNickname = formData.get('nickName');
  const email = formData.get('email');
  const password = formData.get('password');

  // Validate username
  if (!isValidName("Nickname", userNickname)) return;

  // Validate email
  if (email.trim() === "") {
    return showMessage("Email is required.");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return showMessage("Please enter a valid email address.");
  }

  // Validate password
  if (password.trim() === "") {
    return showMessage("Password is required.");
  } else if (password.length <= 7) {
    return showMessage("Password must be at least 8 characters long.");
  } else if (password.toLowerCase() === "password") {
    return showMessage("Password cannot be 'password'.");
  }

  const jsonData = {
    nickName: userNickname,
    email: email,
    password: password,
  };

  console.log(jsonData)
  fetch('/login',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(jsonData),
  })
  .then(response => {
    if (response.ok){
      validSession = true;
      currentView = MAIN_VIEW;
      toggleView(event);
      showMessage("Log in successful!");
    } else{
      return response.json().then(errorData => {
        showMessage(errorData.message);
      });
    }
  })
  .catch(error =>{
    console.error("Error:", error);
    showMessage("An error occurred. Please check your connection.");
  });
};

function isValidName(field, data){
  if (data.trim() === ""){
    showMessage(`${field} is required.`);
    return false;
  } else if (data.length > 16 || data.length < 3 || !/^[\u0000-\u007F]+$/.test(data)){
    showMessage(`${field}  must be between 3 to 16 alphanumeric characters, '_' or '-'`);
    return false;
  }
  return true;
};

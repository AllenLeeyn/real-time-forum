document.getElementById('signUpSubmit').onclick = signUpSubmition;

function signUpSubmition(event){
  event.preventDefault();
  const form = document.getElementById('signUpForm');
  const formData = new FormData(form);

  const userFirstName = document.querySelector("input[name='firstName']");
  const userLastName = document.querySelector("input[name='lastName']");
  const userNickname = document.querySelector("input[name='nickName']");
  const gender = document.querySelector("input[name='gender']:checked");
  const age = parseInt(document.querySelector("input[name='age']").value);
  const email = document.querySelector("input[name='email']");
  const password = document.querySelector("input[name='password']");
  const confirmPassword = document.querySelector("input[name='confirm-password']");

  // Validate username
  if (!isValidName("First Name", userFirstName)) return;
  if (!isValidName("Last Name", userLastName)) return;
  if (!isValidName("Nickname", userNickname)) return;

  console.log(gender.value)
  // Validate gender (check if one of the radio buttons is selected and its value is valid)
  if (!gender || !['Male', 'Female', 'Other'].includes(gender.value)) {
    return showMessage("Please select a valid gender (Male, Female, or Other).");
  }

  if (isNaN(age) || age < 9 || age > 100) {
    return showMessage("Please enter a valid age between 9 and 100.");
  }

  // Validate email
  if (email.value.trim() === "") {
    return showMessage("Email is required.");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.value)) {
    return showMessage("Please enter a valid email address.");
  }

  // Validate password
  if (password.value.trim() === "") {
    return showMessage("Password is required.");
  } else if (password.value.length <= 7) {
    return showMessage("Password must be at least 8 characters long.");
  } else if (password.value.toLowerCase() === "password") {
    return showMessage("Password cannot be 'password'.");
  }
  if (confirmPassword.value.trim() === ""){
    return showMessage("Passwords do not match.");
  } else if(password.value !== confirmPassword.value){
    return showMessage("Passwords do not match.");
  }

  const jsonData = {
    firstName: userFirstName.value,
    lastName: userLastName.value,
    nickName: userNickname.value,
    gender: gender.value,
    age: age,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  };
  console.log(JSON.stringify(jsonData));

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
      window.location.href = '/';
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
  if (data.value.trim() === ""){
    showMessage(`${field} is required.`);
    return false;
  } else if (data.value.length > 16 || data.value.length < 3 || !/^[\u0000-\u007F]+$/.test(data.value)){
    showMessage(`${field}  must be between 3 to 16 alphanumeric characters, '_' or '-'`);
    return false;
  }
  return true;
};

function formDataToJSON(formData) {
  const formObj = {};
  formData.forEach((value, key) => {
    formObj[key] = value;
  });
  return formObj;
}
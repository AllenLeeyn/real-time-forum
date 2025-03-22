document.getElementById('signup-btn').onclick = signUpSubmition;
document.getElementById('login-btn').onclick = logInSubmition;
document.getElementById('logout-btn').onclick = logOutSubmition;
document.getElementById('toLogIn').onclick = toggleView;
document.getElementById('toSignUp').onclick = toggleView;
document.addEventListener('DOMContentLoaded', start());

const VALIDATION_VIEW = document.getElementById("validationView");
const SIGNUP_VIEW = document.getElementById("signUpFormContainer");
const LOGIN_VIEW = document.getElementById("logInFormContainer");
const MAIN_VIEW = document.getElementById("mainView");

const CATEGORIES_LIST = document.getElementById("categoriesList");
const MAIN_DISPLAY = document.getElementById("main-display");

let categories = [];
let posts = [];

let validSession = false;
let currentView = SIGNUP_VIEW;

/*------ start ------*/
function start(){
  fetch('/posts')
  .then(async response => {
    if (response.ok){
      validSession = true;
      currentView = MAIN_VIEW;
      data = await response.json();
      categories = data.categories;
      console.log(categories)
      insertCategories();
      posts = data.posts;
      insertPosts();
    } 
    renderView();
  })
  .catch(error =>{
    console.error("Error:", error);
    showMessage("An error occurred. Please check your connection.");
  });
}

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
    MAIN_VIEW.style.display = 'flex';
  }
}

function insertCategories(){
  CATEGORIES_LIST.innerHTML = `
    <li><a href="/posts" class="category-item active">All</a></li>
    <li><a href="/posts?filterBy=createdBy" class="category-item">My posts</a></li>
    <li><a href="/posts?filterBy=likedBy" class="category-item">Liked posts</a></li>`;

  categories.forEach((category, index) => {
    const listElement = document.createElement('li');
    listElement.innerHTML = `<a href="/posts?filterBy=category&id=${index}" class="category-item">${category}</a>`;
    CATEGORIES_LIST.appendChild(listElement);
  });

  addCategoriesListeners();
}

function addCategoriesListeners(){
  const categoryItems = Array.from(CATEGORIES_LIST.children);
  currentFilter = categoryItems[0];
  categoryItems.forEach(item => addCategoriesListener(item));
}

function addCategoriesListener(item){
  const categoryHref = item.querySelector('a').getAttribute('href');
  item.addEventListener('click', (event) => {
    event.preventDefault();

    fetch(categoryHref)
    .then(async response => {
      if (response.ok){
        document.getElementsByClassName('active')[0].classList.remove('active');
        item.querySelector('a').classList.add('active');
        data = await response.json();
        posts = data.posts;
        insertPosts();
      } else {
        currentView = LOGIN_VIEW
        showMessage("Something went wrong. Log in and try again.");
      }
      renderView();
    })
    .catch(error =>{
      console.error("Error:", error);
      showMessage("An error occurred. Please check your connection.");
    });
  });
}

function insertPosts(){
  MAIN_DISPLAY.innerHTML = '';
  if (!Array.isArray(posts) || posts.length === 0){
    MAIN_DISPLAY.innerHTML = `
      <div class="post-card">
        <h3>
          No post found
        </h3>
      </div>
      `;
    return;
  }
  posts.forEach(post =>{insertPost(post)});
  addFeedbackListeners();
}

function insertPost(post){
  const row = MAIN_DISPLAY.insertRow();
  const cell = row.insertCell();
  const postElement = document.createElement('div');
  postElement.innerHTML = `
    <div>
      <div class="post-header">
        <div class="post-meta">
          <a href="/profile?id=${post.UserID}" class="post-author">${post.UserName}</a>
          <div class="post-time">${post.CreatedAt}</div>
        </div>
      </div>
      <div class="post-content">
        <h3>
          <a href="/post?id=${post.ID}">${post.title}</a>
        </h3>
        <pre>${post.content}</pre>
      </div>
      <div class="post-actions" data-id=${post.ID} data-state="${post.Rating}" data-for="post">
        <button class="icon-button like-button" data-id=${post.ID} data-for="post">
          <i class="fas fa-thumbs-up"></i> <span>${post.LikeCount}</span>
        </button>
        <button class="icon-button dislike-button" data-id=${post.ID} data-for="post">
          <i class="fas fa-thumbs-down"></i> <span>${post.DislikeCount}</span>
        </button>
        <form action="/post?id=${post.ID}" method="GET">
          <input type="hidden" name="id" value="${post.ID}" />
          <button type="submit" class="icon-button">
            <i class="fas fa-comment"></i> <span>${post.CommentCount}</span>
          </button>
        </form>
        <p class="icon-button">
          <span>${post.CatNames}</span>
        </p>
      </div>
    </div>
    `;
  cell.appendChild(postElement);
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
  const age = parseInt(formData.get('age'));
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
      showMessage("Signup successful!");
      start();
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

const nickNameRadio = document.getElementById("nickNameField");
const nickNameGroup = document.getElementById("nickNameGroup");
const emailRadio = document.getElementById("emailField");
const emailGroup = document.getElementById("emailGroup");
nickNameRadio.addEventListener("change", toggleFields);
emailRadio.addEventListener("change", toggleFields);

function toggleFields() {
  if (nickNameRadio.checked) {
    nickNameGroup.style.display = "flex";
    emailGroup.style.display = "none";
  } else if (emailRadio.checked) {
    nickNameGroup.style.display = "none";
    emailGroup.style.display = "flex";
  }
}

function logInSubmition(event){
  event.preventDefault();
  const form = document.getElementById('logInForm');
  const formData = new FormData(form);

  let userNickname = formData.get('nickName');
  let email = formData.get('email');
  const password = formData.get('password');

  // Validate username
  if (nickNameRadio.checked){
    console.log(userNickname)
    if (!isValidName("Nickname", userNickname)) return;
  } else {userNickname = ""}

  // Validate email
  if (emailRadio.checked){
    if (email.trim() === "") {
      return showMessage("Email is required.");
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return showMessage("Please enter a valid email address.");
    }
  } else {email = ""}

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
      showMessage("Log in successful!");
      start();
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

function logOutSubmition(event){
  event.preventDefault();
  validSession = false;
  currentView = LOGIN_VIEW;
  renderView();

  fetch('/logout',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  .then(response => {
    if (response.ok){
      showMessage("Log out successful!");
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

/*------ new post display ------*/
document.getElementById('new-post').onclick = function () {
  MAIN_DISPLAY.innerHTML = '';
  const newPostElement = document.createElement('div');
  newPostElement.className = "newPost";
  newPostElement.innerHTML = `
    <form id="newPostForm">
      <div class="input-group">
        <input
          type="text"
          name="title"
          placeholder="Post Title"
          required
        />
      </div>
      <div class="input-group">
        <textarea
          name="content"
          placeholder="Write your thread content here..."
          rows="10"
          required
        ></textarea>
      </div>
      <div class="input-group">
        <h4>Click to select categories:</h4>
        <div class="checkbox-group">
          ${categories.map((cat, index) => `
            <div class="checkbox-item">
              <input type="checkbox" id="category${index}" name="categories" value=${index}>
              <label for="category${index}">${cat}</label>
            </div>
            `).join('')}
        </div>
      </div>
      <div class="input-group">
        <button class="new-post" id="newPostSubmit" type="submit">Create Post</button>
      </div>
    </form>`;
  MAIN_DISPLAY.appendChild(newPostElement);
  document.getElementById('newPostSubmit').onclick = newPostSubmition;
};

function newPostSubmition(event) {
  event.preventDefault();
  const form = document.getElementById('newPostForm');
  const formData = new FormData(form);
  
  const title = formData.get('title');
  const content = formData.get('content');
  const categories = formData.getAll('categories');
  const categoriesInt = categories.map(category => parseInt(category));

  console.log(form)
  const jsonData = {
    title: title,
    content: content,
    categories: categoriesInt,
  }
  fetch('/new-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(jsonData),
  })
  .then(response => {
      if (response.ok) {
        showMessage("Post created!");
        start();
      } else {
        return response.json().then(errorData => {
          showMessage(errorData.message);
        });
      }
  })
  .catch(error => {
    showMessage("An error occurred. Please check your connection and try again.");
    console.error("Error:", error);
  });
};

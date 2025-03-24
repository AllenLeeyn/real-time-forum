import { submitSignUp, submitLogIn, submitLogOut } from "./validation.js";
import { showNewPost } from "./newPost.js";
import { insertPostCards } from "./postCard.js";

document.addEventListener('DOMContentLoaded', start());
document.getElementById('signup-btn').onclick = submitSignUp;
document.getElementById('login-btn').onclick = submitLogIn;
document.getElementById('logout-btn').onclick = submitLogOut;
document.getElementById('toLogIn').onclick = toggleView;
document.getElementById('toSignUp').onclick = toggleView;
document.getElementById('new-post').onclick = showNewPost;

const VALIDATION_VIEW = document.getElementById("validationView");
const SIGNUP_VIEW = document.getElementById("signUpFormContainer");
const LOGIN_VIEW = document.getElementById("logInFormContainer");
const MAIN_VIEW = document.getElementById("mainView");

const CATEGORIES_LIST = document.getElementById("categoriesList");
export const DISPLAY_AREA = document.getElementById("displayArea");

export const currentState = {
  isValid: false,
  categories: [],
  view: SIGNUP_VIEW,
  posts: [],
}

/*------ toast message function ------*/
export function showMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('toast-message');
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

/*------ handle typical JSON fetch ------*/
function handleGetFetch(path, handler){
  fetch(path)
  .then(handler)
  .catch(error =>{
    console.error("Error:", error);
    showMessage("An error occurred. Please check your connection.");
  });
}

export function handlePostFetch(path, jsonData, message){
  fetch(path, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(jsonData),
  })
  .then(response => {
      if (response.ok){
          showMessage(message);
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

/*------ start ------*/
export function start(){
  handleGetFetch('/posts', async (response)=>{
    currentState.isValid = false;
    currentState.view = SIGNUP_VIEW;

    if (response.ok){
      currentState.isValid = true;
      currentState.view = MAIN_VIEW;
      const data = await response.json();
      currentState.categories = data.categories;
      insertCategories();
      currentState.posts = data.posts;
      insertPostCards();
    } 
    renderView();
  });
}

/*------ view functions ------*/
function toggleView(event){
  const clickedId = event.target.id;

  if (clickedId === 'toLogIn') {
    currentState.view = LOGIN_VIEW;

  } else if (clickedId === 'toSignUp') {
    currentState.view = SIGNUP_VIEW;
  }
  renderView();
}

function renderView(){
  VALIDATION_VIEW.style.display = 'none';
  SIGNUP_VIEW.style.display = 'none';
  LOGIN_VIEW.style.display = 'none';
  MAIN_VIEW.style.display = 'none';

  if ( currentState.view === LOGIN_VIEW) {
    VALIDATION_VIEW.style.display = 'block';
    LOGIN_VIEW.style.display = 'block';

  } else if ( currentState.view === SIGNUP_VIEW) {
    VALIDATION_VIEW.style.display = 'block';
    SIGNUP_VIEW.style.display = 'block';

  } else if ( currentState.view === MAIN_VIEW) {
    MAIN_VIEW.style.display = 'flex';
  }
}

function insertCategories(){
  CATEGORIES_LIST.innerHTML = `
    <li><a href="/posts" class="category-item active">All</a></li>
    <li><a href="/posts?filterBy=createdBy" class="category-item">My posts</a></li>
    <li><a href="/posts?filterBy=likedBy" class="category-item">Liked posts</a></li>`;

    currentState.categories.forEach((category, index) => {
    const listElement = document.createElement('li');
    listElement.innerHTML = `<a href="/posts?filterBy=category&id=${index}" class="category-item">${category}</a>`;
    CATEGORIES_LIST.appendChild(listElement);
  });

  addCategoriesListeners();
}

function addCategoriesListeners(){
  const categoryItems = Array.from(CATEGORIES_LIST.children);
  categoryItems.forEach(item => addCategoriesListener(item));
}

function addCategoriesListener(item){
  const categoryHref = item.querySelector('a').getAttribute('href');
  item.addEventListener('click', (event) => {
    event.preventDefault();

    handleGetFetch(categoryHref, async response => {
      if (response.ok){
        document.getElementsByClassName('active')[0].classList.remove('active');
        item.querySelector('a').classList.add('active');
        const data = await response.json();
        posts = data.posts;
        insertPosts();
      } else {
        currentState.view = LOGIN_VIEW
        showMessage("Something went wrong. Log in and try again.");
      }
      renderView();
    });
  });
}
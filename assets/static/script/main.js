import { templateCategoriesList, templateNoFound } from "./template.js";
import { submitSignUp, submitLogIn, submitLogOut } from "./validation.js";
import { profileLinkHandler, addViewProfileLinksListeners } from "./profile.js";
import { insertNewPostForm } from "./newPost.js";
import { addViewPostLinksListeners, insertPostCard } from "./post.js";
import { addFeedbackListeners } from "./feedback.js";

document.addEventListener('DOMContentLoaded', start());
document.getElementById('logo-text').onclick = start;
document.getElementById('toLogIn').onclick = toggleView;
document.getElementById('toSignUp').onclick = toggleView;
document.getElementById('signup-btn').onclick = submitSignUp;
document.getElementById('login-btn').onclick = submitLogIn;
document.getElementById('logout-btn').onclick = submitLogOut;
document.getElementById('new-post').onclick = insertNewPostForm;

const VALIDATION_VIEW = document.getElementById("validationView");
const SIGNUP_VIEW = document.getElementById("signUpFormContainer");
const LOGIN_VIEW = document.getElementById("logInFormContainer");
const MAIN_VIEW = document.getElementById("mainView");

const PROFILE_BTN = document.getElementById("profile-btn");
PROFILE_BTN.onclick = profileLinkHandler;

const CATEGORIES_LIST = document.getElementById("categoriesList");

const FEED_DISPLAY = document.getElementById("feedDisplay");
export const POST_DISPLAY = document.getElementById("postDisplay");
export const NEW_POST_DISPLAY = document.getElementById("newPostDisplay");
export const PROFILE_DISPLAY = document.getElementById("profileDisplay");

export const currentState = {
  isValid: false,
  categories: [],
  view: SIGNUP_VIEW,
  display: FEED_DISPLAY,
}

/*------ start ------*/
export function insertFeed(posts){
  FEED_DISPLAY.innerHTML = '';
  const container = document.createElement('tbody');
  FEED_DISPLAY.append(container);

  if (!Array.isArray(posts) || posts.length === 0){
    container.innerHTML = templateNoFound("post");
  } else {
    posts.forEach(post =>{
      insertPostCard(post, container);
    });
  }
}

export function start(){
  handleGetFetch('/posts', async (response)=>{
    currentState.isValid = false;
    currentState.view = SIGNUP_VIEW;

    if (response.ok){
      currentState.isValid = true;
      currentState.view = MAIN_VIEW;

      const data = await response.json();
      insertFeed(data.posts);
      currentState.display = FEED_DISPLAY;

      currentState.categories = data.categories;
      CATEGORIES_LIST.innerHTML = templateCategoriesList(currentState.categories);
      addCategoriesListeners();

      PROFILE_BTN.textContent = data.userName;
      PROFILE_BTN.setAttribute('href', `/profile?id=${data.userID}`)
    } 
    renderView();
  });
}

function addCategoriesListeners(){
  const categoryItems = Array.from(CATEGORIES_LIST.children);
  categoryItems.forEach(item => addCategoriesListener(item));
}

function addCategoriesListener(item){
  const categoryHref = item.querySelector('a').getAttribute('href');
  item.onclick =  (event) => {
    event.preventDefault();

    handleGetFetch(categoryHref, async response => {
      if (response.ok){
        document.getElementsByClassName('active')[0].classList.remove('active');
        item.querySelector('a').classList.add('active');
        const data = await response.json();
        insertFeed(data.posts);
        currentState.display = FEED_DISPLAY;
      } else {
        currentState.view = LOGIN_VIEW
        showMessage("Something went wrong. Log in and try again.");
      }
      renderView();
    });
  };
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
    renderDisplay();
  }
}

export function renderDisplay(){
  FEED_DISPLAY.style.display = 'none';
  POST_DISPLAY.style.display = 'none';
  NEW_POST_DISPLAY.style.display = 'none';
  PROFILE_DISPLAY.style.display = 'none';

  if (currentState.display === FEED_DISPLAY) {
    FEED_DISPLAY.style.display = '';

  } else if (currentState.display === NEW_POST_DISPLAY){
    NEW_POST_DISPLAY.style.display = '';

  } else if (currentState.display === POST_DISPLAY){
    POST_DISPLAY.style.display = '';

  } else if (currentState.display === PROFILE_DISPLAY){
    PROFILE_DISPLAY.style.display = '';
  }
  addFeedbackListeners();
  addViewPostLinksListeners();
  addViewProfileLinksListeners();
}

/*------ toast message function ------*/
export function showMessage(message) {
  if (message === "") return;
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('toast-message');
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

/*------ handle typical JSON fetch ------*/
export function handleGetFetch(path, handler){
  fetch(path)
  .then(handler)
  .catch(error =>{
    console.error("Error:", error);
    showMessage("An error occurred. Please check your connection.");
  });
}

export function handlePostFetch(path, jsonData, message, drawFn){
  fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(jsonData),
  })
  .then(response => {
    if (response.ok){
      showMessage(message);
      drawFn();
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

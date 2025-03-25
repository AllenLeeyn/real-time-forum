import { NEW_POST_DISPLAY, currentState, handlePostFetch, renderDisplay, start } from "./main.js";
import { templateNewPost } from "./template.js";

/*------ new post display ------*/
export function showNewPost(event){
  event.preventDefault();
  NEW_POST_DISPLAY.innerHTML = '';
  const newPostElement = document.createElement('div');
  newPostElement.className = "newPost";
  newPostElement.innerHTML = templateNewPost(currentState.categories);
  NEW_POST_DISPLAY.appendChild(newPostElement);
  currentState.display = NEW_POST_DISPLAY;
  renderDisplay();
  document.getElementById('newPostSubmit').onclick = submitNewPost;
};
  
function submitNewPost(event) {
    event.preventDefault();
    const form = document.getElementById('newPostForm');
    const formData = new FormData(form);
    
    const title = formData.get('title');
    const content = formData.get('content');
    const categories = formData.getAll('categories');
    const categoriesInt = categories.map(category => parseInt(category));

    handlePostFetch('/create-post', {
      title: title,
      content: content,
      categories: categoriesInt,
    }, "Post created!", start);
};
  
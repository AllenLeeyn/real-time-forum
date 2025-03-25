import { NEW_POST_DISPLAY, currentState, handlePostFetch, renderDisplay, start } from "./main.js";

/*------ new post display ------*/
export function showNewPost(){
  NEW_POST_DISPLAY.innerHTML = '';
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
          ${currentState.categories.map((cat, index) => `
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
  NEW_POST_DISPLAY.appendChild(newPostElement);
  currentState.display = NEW_POST_DISPLAY;
  renderDisplay();
  document.getElementById('newPostForm').onsubmit = submitNewPost;};
  
function submitNewPost(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const title = formData.get('title');
    const content = formData.get('content');
    const categories = formData.getAll('categories').map(c => parseInt(c));
    
    handlePostFetch('/new-post', {
      title: title,
      content: content,
      categories: categories,
    }, "Post created!", start);
};
  
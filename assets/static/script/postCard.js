import { currentState, DISPLAY_AREA } from "./main.js";
import { addFeedbackListeners } from "./feedback.js";

export function insertPostCards(){
    DISPLAY_AREA.innerHTML = '';
    if (currentState.posts.length === 0){
      DISPLAY_AREA.innerHTML = `
        <div class="post-card">
          <h3>
            No post found
          </h3>
        </div>
        `;
      return;
    }
    currentState.posts.forEach(post =>{insertPostCard(post)});
    addFeedbackListeners();
}
  
function insertPostCard(post){
    const row = DISPLAY_AREA.insertRow();
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
  
import { currentState, POST_DISPLAY, renderDisplay, handleGetFetch, handlePostFetch, showMessage } from "./main.js";

export function insertPostCard(post, container){
    console.log('Inserting post card for:', post);
    const article = document.createElement('article');
    const postElement = document.createElement('div');
    postElement.classList.add('post-card');
  
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
          <button type="submit" class="icon-button">
            <i class="fas fa-comment"></i> <span>${post.CommentCount}</span>
          </button>
          <p class="icon-button">
            <span>${post.CatNames}</span>
          </p>
        </div>
      </div>
      `;
      article.appendChild(postElement);
      container.appendChild(article);
      console.log('Post card appended to container.');
    
      return article;
}

export function addViewPostLinksListeners(){
    const postLinks = document.querySelectorAll(".post-content h3 a");

    postLinks.forEach(link =>{
        link.addEventListener("click", (event) => postLinkListener(event, link))
    })
}

function postLinkListener(event, link){
    event.preventDefault();
    handleGetFetch(link.href, postLinkHandler)
}

async function postLinkHandler(response){
    if (response.ok) {
        POST_DISPLAY.innerHTML = "";
        const data = await response.json();
        POST_DISPLAY.appendChild(getPost(data));
        currentState.display = POST_DISPLAY;
        renderDisplay();
    }
}

function getPost(data){
    const container = document.createElement('article');

    const postElement = insertPostCard(data.post, container);
    postElement.innerHTML += `
        <div id="comment-form">
        <textarea id="comment-input" placeholder="Write your comment here..." rows="3"></textarea>
        <button id="submit-comment" data-id=${data.post.ID}>Post Comment</button>
        </div>
    `;

    if (!Array.isArray(data.comments) || data.comments.length === 0){
        postElement.innerHTML +=`
        <div>
            <div class="post-card">
                <h3>
                No comment found
                </h3>
            </div>
        </div>
        `;
    } else {
        data.comments.forEach(comment => {
            postElement.innerHTML +=`
            <div>
                <div class="post-header">
                    <div class="post-meta">
                    <a href="/profile?id="${comment.UserID}" class="post-author">${comment.UserName}</a>
                    <div class="post-time">${comment.CreatedAt}</div>
                    </div>
                </div>
                <div class="post-content">
                    <pre>${comment.content}</pre>
                </div>
                <div class="post-actions" data-id=${comment.ID} data-state="${comment.Rating}" data-for="comment">
                    <button class="icon-button like-button" data-id=${comment.ID} data-for="comment">
                    <i class="fas fa-thumbs-up"></i> <span>${comment.LikeCount}</span>
                    </button>
                    <button class="icon-button dislike-button" data-id=${comment.ID} data-for="comment">
                    <i class="fas fa-thumbs-down"></i> <span>${comment.DislikeCount}</span>
                    </button>
                </div>
            </div>`;
        });
    }
    return container;
}

export function addSubmitCommentListener(){
    document.getElementById('submit-comment').onclick = function (event){
        event.preventDefault();

        const postID = parseInt(this.getAttribute('data-id'));
        const commentInput = document.getElementById('comment-input')
        const commentText = commentInput.value.trim()
    
        if (!commentText) {
            showMessage('Comment cannot be empty!')
            return;
        }
        handlePostFetch(`/add-comment`, { 
            postID: postID,
            content: commentText,
        }, "Comment created!", ()=>{
            handleGetFetch(`/post?id=${postID}`, postLinkHandler)
        });
    };
}

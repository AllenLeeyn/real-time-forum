export const templateNoFound = (value) => `
  <tbody><tr><td>
    <div class="post-card">
      <h3>
        No ${value} found
      </h3>
    </div>
  </tbody></tr></td>`;

export const templateNewPost = (categories) => `
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

export const templatePostCard = (post) => `
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
      <button class="icon-button">
        <i class="fas fa-comment" href="/post?id=${post.ID}"></i> <span>${post.CommentCount}</span>
      </button>
      <p class="icon-button">
        <span>${post.CatNames}</span>
      </p>
    </div>
  </div>`;

export const templateCommentCard = (comment) => `
  <div>
    <div class="post-header">
      <div class="post-meta">
      <a href="/profile?id=${comment.UserID}" class="post-author">${comment.UserName}</a>
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

export const templateCommentForm = (post) => `
  <div id="comment-form">
    <textarea id="comment-input" placeholder="Write your comment here..." rows="3"></textarea>
    <button id="submit-comment" data-id=${post.ID}>Post Comment</button>
  </div>`;

export const templateProfileCard = (data) => {
  let result = `
    <div class="post-header">
        <div class="post-meta">
            <h3>Name: ${data.name}</h3>
        </div>
    </div>
    <div>
        <h4>
        Posts:
        </h4>
    </div>`;

  if (!Array.isArray(data.posts) || data.posts.length === 0){
    result+=templateNoFound("post");
  } else {
    data.posts.forEach(post => {
      result += templatePostCard(post);
    });
  }
  return result;
};

export const templateCategoriesList = (categories) => {
  let result = `
    <li><a href="/posts" class="category-item active">All</a></li>
    <li><a href="/posts?filterBy=createdBy" class="category-item">My posts</a></li>
    <li><a href="/posts?filterBy=likedBy" class="category-item">Liked posts</a></li>`;

  categories.forEach((category, index) => {
    result += `
    <li><a href="/posts?filterBy=category&id=${index}" class="category-item">${category}</a></li>`;
  })
  return result;
};
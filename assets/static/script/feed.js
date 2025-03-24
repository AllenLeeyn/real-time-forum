import { insertPostCard } from "./post.js";

export function getFeed(posts){
  const container = document.createElement('tbody');

  if (!Array.isArray(posts) || posts.length === 0){
    container.innerHTML = `
    <tbody><tr><td>
      <div class="post-card">
        <h3>
          No post found
        </h3>
      </div>
    </tbody></tr></td>`;
  } else {
    posts.forEach(post =>{
      insertPostCard(post, container);
    });
  }

  return container;
}
  
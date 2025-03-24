import { insertPostCard } from "./post.js";

export function getFeed(posts) {
  console.log('Creating feed for:', posts);
  const container = document.getElementById('feedDisplay');

  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = `
      <article>
        <h3>No post found</h3>
      </article>
    `;
  } else {
    container.innerHTML = ''; 
    posts.forEach(post => {
      console.log('Creating post card for:', post);
      insertPostCard(post, container);
      console.log('Post card created and appended.');
    });
  }
  return container.innerHTML;
}

// export function getFeed(posts){
//   const container = document.createElement('tbody');

//   if (!Array.isArray(posts) || posts.length === 0){
//     container.innerHTML = `
//     <tbody><tr><td>
//       <div class="post-card">
//         <h3>
//           No post found
//         </h3>
//       </div>
//     </tbody></tr></td>`;
//   } else {
//     posts.forEach(post =>{
//       insertPostCard(post, container);
//     });
//   }

//   return container;
// }
  
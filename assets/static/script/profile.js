import { currentState, PROFILE_DISPLAY, renderDisplay, handleGetFetch } from "./main.js";

export function addViewProfileLinksListeners(){
    const profileLinks = document.querySelectorAll('.post-author');

    profileLinks.forEach(link =>{
        link.addEventListener("click", showProfile);
    })
}

function getProfile(data){
    const container = document.createElement('tbody');
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    const profileElement = document.createElement('div');
    profileElement.classList.add('post-card');

    profileElement.innerHTML = `
        <div class="post-header">
            <div class="post-meta">
                <h3 class="post-author">Name: ${data.name}</h3>
            </div>
        </div>
        <div>
            <h4>
            Posts:
            </h4>
        </div>
        `;

    if (!Array.isArray(data.posts) || data.posts.length === 0){
        profileElement.innerHTML +=`
        <div>
            <div class="post-card">
                <h3>
                No post found
                </h3>
            </div>
        </div>
        `;
    } else {
        data.posts.forEach(post => {
            profileElement.innerHTML +=`
            <div>
                <div class="post-header">
                    <div class="post-meta">
                    <div class="post-time">${post.CreatedAt}</div>
                    </div>
                </div>
                <div class="post-content">
                    <h3>
                        <a href="/post?id=${post.ID}">${post.title}</a>
                    </h3>
                    <pre>${post.content}</pre>
                </div>
                <div class="post-actions" data-id=${post.ID} data-state="${post.Rating}" data-for="comment">
                    <button class="icon-button like-button" data-id=${post.ID} data-for="comment">
                    <i class="fas fa-thumbs-up"></i> <span>${post.LikeCount}</span>
                    </button>
                    <button class="icon-button dislike-button" data-id=${post.ID} data-for="comment">
                    <i class="fas fa-thumbs-down"></i> <span>${post.DislikeCount}</span>
                    </button>
                </div>
            </div>`;
        });
    }

    cell.appendChild(profileElement);
    row.appendChild(cell);
    container.appendChild(row);
    return container;
}

async function profileLinkHandler(response){
    if (response.ok) {
        PROFILE_DISPLAY.innerHTML = '';
        const data = await response.json();
        PROFILE_DISPLAY.appendChild(getProfile(data));
        currentState.display = PROFILE_DISPLAY;
        renderDisplay();
    }
}

export function showProfile(event){
    event.preventDefault();
    const path = event.target.getAttribute('href');
    handleGetFetch(path, profileLinkHandler)
}

import { currentState, POST_DISPLAY, renderDisplay, handleGetFetch, handlePostFetch, showMessage } from "./main.js";
import { templateCommentCard, templateCommentForm, templateNoFound, templatePostCard } from "./template.js";

export function insertPostCard(post, container){
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    const postElement = document.createElement('div');
    postElement.classList.add('post-card');
    postElement.innerHTML = templatePostCard(post);

    cell.appendChild(postElement);
    row.appendChild(cell);
    container.appendChild(row);

    return postElement;
}

export function addViewPostLinksListeners(){
    const postLinks = document.querySelectorAll(".post-content h3 a");
    const commentBtns = document.querySelectorAll(".fas.fa-comment");

    postLinks.forEach(link =>{
        link.addEventListener("click", postLinkHandler)
    })
    commentBtns.forEach(link =>{
        link.addEventListener("click", postLinkHandler)
    })
}

function postLinkHandler(event){
    event.preventDefault();
    const path = event.target.getAttribute('href');

    handleGetFetch(path, (response) => {
        if (response.ok) {
            drawPostWithComments(response);
        }
    });
}

function getPost(data){
    const container = document.createElement('tbody');
    const postElement = insertPostCard(data.post, container);
    postElement.innerHTML += templateCommentForm(data.post);

    if (!Array.isArray(data.comments) || data.comments.length === 0){
        postElement.innerHTML += templateNoFound("comment");
    } else {
        data.comments.forEach(comment => {
            postElement.innerHTML += templateCommentCard(comment);
        });
    }
    return container;
}

function submitComment(event){
    const postID = parseInt(event.target.getAttribute('data-id'));
    const commentInput = document.getElementById('comment-input')
    const commentText = commentInput.value.trim()

    if (!commentText) {
        showMessage('Comment cannot be empty!')
        return;
    }
    handlePostFetch(`/create-comment`, { 
        postID: postID,
        content: commentText,
    }, "Comment created!", ()=>{
        handleGetFetch(`/post?id=${postID}`, async (response) => {
            if (response.ok) {
                drawPostWithComments(response);
            }
        })
    });
};

async function drawPostWithComments(response){
    POST_DISPLAY.innerHTML = "";
    const data = await response.json();
    POST_DISPLAY.appendChild(getPost(data));
    currentState.display = POST_DISPLAY;
    renderDisplay();
    document.getElementById('submit-comment').onclick = submitComment;
}

import { handlePostFetch } from "./main.js";

export function addFeedbackListeners(){
  // Get all like and dislike buttons
  const likeButtons = document.querySelectorAll(".like-button");
  const dislikeButtons = document.querySelectorAll(".dislike-button");
  
  // Attach event listeners to both like and dislike buttons
  likeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const forType = button.getAttribute("data-for");
        const parentID = parseInt(button.getAttribute("data-id"), 10);
        const parentElement = button.closest('.post-actions')
        handlePostFeedback(forType, parentID, "like", parentElement);
    });
  });
  
  dislikeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const forType = button.getAttribute("data-for");
        const parentID = parseInt(button.getAttribute("data-id"), 10);
        const parentElement = button.closest('.post-actions')
        handlePostFeedback(forType, parentID, "dislike", parentElement);
    });
  });
}

// Unified function to handle both like and dislike actions
function handlePostFeedback(forType, parentID, action, parentElement) {
    const currentState = parseInt(parentElement.getAttribute('data-state'), 10);
    let newState = currentState;
    let newAction = 0; // Default action (neutral)

    // Get like and dislike button elements for the post
    const likeButton = parentElement.children[0];;
    const likeCountSpan = likeButton.querySelector("span");
    let newLikeCount = parseInt(likeCountSpan.textContent);

    const dislikeButton = parentElement.children[1];;
    const dislikeCountSpan = dislikeButton.querySelector("span");
    let newDislikeCount = parseInt(dislikeCountSpan.textContent);

    // Handle the "like" action
    if (action === "like") {
        if (currentState === 1) { // unLike
            newState = 0
            newLikeCount = newLikeCount - 1;
            newAction = 0;
        } else {
            if (currentState === -1) { // remove dislike
              newDislikeCount = newDislikeCount - 1;
            }
            newState = 1
            newLikeCount = newLikeCount + 1;
            newAction = 1;
        }
    } 
    // Handle the "dislike" action
    else if (action === "dislike") {
        if (currentState === -1) { // unDislike
          newState = 0
          newDislikeCount = newDislikeCount - 1;
          newAction = 0;
        } else {
            if (currentState === 1) { // remove like
              newLikeCount = newLikeCount - 1;
            }
            newState = -1
            newDislikeCount = newDislikeCount + 1;
            newAction = -1; // Dislike action
        }
    }

    handlePostFetch(`/feedback`, {
        tgt: forType,
        parentID: parentID,
        rating: newAction,
      }, "", ()=>{
        parentElement.setAttribute('data-state', newState);
        likeCountSpan.textContent = newLikeCount;
        dislikeCountSpan.textContent = newDislikeCount;
      });
}


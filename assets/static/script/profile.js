import { currentState, PROFILE_DISPLAY, renderDisplay, handleGetFetch } from "./main.js";
import { templateProfileCard } from "./template.js";

export function addViewProfileLinksListeners(){
    const profileLinks = document.querySelectorAll('.post-author');
    profileLinks.forEach(link =>{
        link.addEventListener("click", profileLinkHandler);
    });
}

export function profileLinkHandler(event){
    event.preventDefault();
    const path = event.target.getAttribute('href');
    
    handleGetFetch(path, async (response) => {
        if (response.ok) {
            PROFILE_DISPLAY.innerHTML = '';
            const data = await response.json();
            PROFILE_DISPLAY.appendChild(getProfile(data));
            currentState.display = PROFILE_DISPLAY;
            renderDisplay();
        }
    });
}

function getProfile(data){
    const container = document.createElement('tbody');
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    const profileElement = document.createElement('div');
    profileElement.classList.add('post-card');

    profileElement.innerHTML = templateProfileCard(data);

    cell.appendChild(profileElement);
    row.appendChild(cell);
    container.appendChild(row);
    return container;
}

import { currentState, PROFILE_DISPLAY, renderDisplay, handleGetFetch, showTab } from "./main.js";
import { templateProfileCard } from "./template.js";

export function addViewProfileLinksListeners(){
    const profileLinks = document.querySelectorAll('.post-author');
    profileLinks.forEach(link =>{
        link.onclick = profileLinkHandler;
    });
}

export function profileLinkHandler(event){
    event.preventDefault();
    const path = event.target.getAttribute('href');
    
    handleGetFetch(path, async (response) => {
        if (response.ok) {
            PROFILE_DISPLAY.innerHTML = '';
            const data = await response.json();
            PROFILE_DISPLAY.appendChild(insertProfile(data));
            currentState.display = PROFILE_DISPLAY;
            showTab("profile", data.name);
        } else {
            currentState.view = LOGIN_VIEW
            showMessage("Something went wrong. Log in and try again.");
        }
        renderDisplay();
    });
}

function insertProfile(data){
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

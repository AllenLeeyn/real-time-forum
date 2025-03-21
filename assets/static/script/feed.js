// Post Feed to populate with post cards
fetch('/posts')
.then(response => response.json())
.then(data => {
    console.log(data); 

    const postsContainer = document.getElementById('general'); // Correct container ID
    postsContainer.innerHTML = ''; // Clear existing content

    const feedHeader = document.createElement('h2');
    feedHeader.textContent = 'Recent Posts';
    postsContainer.appendChild(feedHeader);

    // Add greeting if user is logged in
    if (data.isValidSession) {
        const greetingHeader = document.createElement('h3');
        greetingHeader.textContent = `Hello, ${data.userName}.`;
        postsContainer.appendChild(greetingHeader);
    }

    if (Array.isArray(data.posts)) {
        // If data is an array
        data.posts.forEach(post => {
            const postCardHTML = renderPostCard(post);
            postsContainer.insertAdjacentHTML('beforeend', postCardHTML);
        });
    } else if (typeof data === 'object') {
        // If data is an object
        Object.keys(data).forEach(key => {
            const post = data[key];
            const postCardHTML = renderPostCard(post);
            postsContainer.insertAdjacentHTML('beforeend', postCardHTML);
        });
    } else {
        console.error('Invalid data format received.');
    }
})
.catch(error => console.error('Error fetching posts:', error));

// Render the post card
function renderPostCard(post) {
    return `
        <div class="post-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
        </div>
    `;
}
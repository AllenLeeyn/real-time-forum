// fetch('/home')
//   .then(response => response.json())
//   .then(data => {
//     console.log(data);
//     // Process and display data here
//     const feedSection = document.getElementById('general');
//     data.forEach(post => {
//       const postCard = document.createElement('div');
//       postCard.classList.add('post-card');
//       postCard.innerHTML = `
//         <h3>${post.title}</h3>
//         <p>${post.content}</p>
//       `;
//       feedSection.appendChild(postCard);
//     });
//   })
//   .catch(error => console.error('Error:', error));


  // Example with loading and error handling
const feedSection = document.getElementById('general');
const loadingIndicator = document.createElement('div');
loadingIndicator.textContent = 'Loading...';
feedSection.appendChild(loadingIndicator);

fetch('/posts')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  })
  .then(data => {
    feedSection.removeChild(loadingIndicator);
    data.forEach(post => {
      const postCard = document.createElement('div');
      postCard.classList.add('post-card');
      postCard.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
      `;
      feedSection.appendChild(postCard);
    });
  })
  .catch(error => {
    feedSection.removeChild(loadingIndicator);
    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Error loading data';
    feedSection.appendChild(errorMessage);
    console.error('Error:', error);
  });

// document.addEventListener('DOMContentLoaded', function() {
    fetch('/posts')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);

        // Find the categories container
        const categoriesContainer = document.querySelector('.categories');

        if (!categoriesContainer) {
            console.error('Categories container not found.');
            return;
        }

        // Clear existing content
        categoriesContainer.innerHTML = '';

        // Add preference header
        const preferenceHeader = document.createElement('h3');
        preferenceHeader.textContent = 'Preference';
        preferenceHeader.style.display = 'none'; 
        categoriesContainer.appendChild(preferenceHeader);

        // Show the preference header if a valid session exists
        if (data.isValidSession) {
            preferenceHeader.style.display = 'block';
            const myPostsHTML = `
                <li><a href="?filterBy=createdBy" class="category-item {{if eq .FilterBy "createdBy"}}active{{end}}">My posts</a></li>
            `;
            const likedPostsHTML = `
                <li><a href="?filterBy=likedBy" class="category-item {{if eq .FilterBy "likedBy"}}active{{end}}">Liked posts</a></li>
            `;

            const sessionList = document.createElement('ul');
            sessionList.insertAdjacentHTML('beforeend', myPostsHTML);
            sessionList.insertAdjacentHTML('beforeend', likedPostsHTML);
            categoriesContainer.appendChild(sessionList);
        }

        // Add categories header
        const categoriesHeader = document.createElement('h3');
        categoriesHeader.textContent = 'Categories';
        categoriesContainer.appendChild(categoriesHeader);

        const categoriesList = document.createElement('ul');
        categoriesContainer.appendChild(categoriesList);

        // Add "All" category link
        const allCategoryHTML = `
            <li><a href="/" class="category-item {{if not .FilterBy}}active{{end}}">All</a></li>
        `;
        categoriesList.insertAdjacentHTML('beforeend', allCategoryHTML);

        // Populate categories dynamically
        data.categories.forEach((category, index) => {
            const categoryHTML = `
                <li><a href="?filterBy=category&id=${index}" class="category-item {{if and (eq $.FilterBy "category") (eq $index $.Id)}}active{{end}}">${category}</a></li>
            `;
            categoriesList.insertAdjacentHTML('beforeend', categoryHTML);
        });
    })
    .catch(error => {
        console.error('Error fetching or handling categories:', error);
    });
// });



// // Fetch categories for the sidebar from the backend
// document.addEventListener('DOMContentLoaded', function() {
//     fetch('/posts')
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log(data);

//         const categoriesContainers = document.querySelectorAll('.categories ul');

//         if (!categoriesContainers.length) {
//             console.error('Categories container not found.');
//             return;
//         }

//         categoriesContainers.forEach(container => {
//         container.innerHTML = ''; // Clear existing content


//         // Add "All" category link
//         const allCategoryHTML = `
//             <li><a href="/" class="category-item {{if not .FilterBy}}active{{end}}">All</a></li>
//         `;
//         container.insertAdjacentHTML('beforeend', allCategoryHTML);

//         // Add session-based categories if needed
//         if (data.isValidSession) {
//             const myPostsHTML = `
//                 <li><a href="?filterBy=createdBy" class="category-item {{if eq .FilterBy "createdBy"}}active{{end}}">My posts</a></li>
//             `;
//             const likedPostsHTML = `
//                 <li><a href="?filterBy=likedBy" class="category-item {{if eq .FilterBy "likedBy"}}active{{end}}">Liked posts</a></li>
//             `;
//             container.insertAdjacentHTML('beforeend', myPostsHTML);
//             container.insertAdjacentHTML('beforeend', likedPostsHTML);
//         }

//         // Populate categories dynamically
//         data.categories.forEach((category, index) => {
//             const categoryHTML = `
//                 <li><a href="?filterBy=category&id=${index}" class="category-item {{if and (eq $.FilterBy "category") (eq $index $.Id)}}active{{end}}">${category}</a></li>
//             `;
//                 container.insertAdjacentHTML('beforeend', categoryHTML);
//         });
//     });
// }) 
// .catch(error => {
//         console.error('Error fetching or handling categories:', error);
//     });
// });

// // Fetch categories for the sidebar from the backend

// fetch('/posts') 
// .then(response => response.json())
// .then(data => {
//     console.log(data); 

//     const categoriesContainer = document.querySelector('.categories ul'); 
//     categoriesContainer.innerHTML = ''; 
//     // Add "All" category link
//     const allCategoryHTML = `
//         <li><a href="/" class="category-item {{if not .FilterBy}}active{{end}}">All</a></li>
//     `;
//     categoriesContainer.insertAdjacentHTML('beforeend', allCategoryHTML);

//     // Add session-based categories if needed
//     if (data.isValidSession) {
//         const myPostsHTML = `
//             <li><a href="?filterBy=createdBy" class="category-item {{if eq .FilterBy "createdBy"}}active{{end}}">My posts</a></li>
//         `;
//         const likedPostsHTML = `
//             <li><a href="?filterBy=likedBy" class="category-item {{if eq .FilterBy "likedBy"}}active{{end}}">Liked posts</a></li>
//         `;
//         categoriesContainer.insertAdjacentHTML('beforeend', myPostsHTML);
//         categoriesContainer.insertAdjacentHTML('beforeend', likedPostsHTML);
//     }

//     // Populate categories dynamically
//     data.categories.forEach((category, index) => {
//         const categoryHTML = `
//             <li><a href="?filterBy=category&id=${index}" class="category-item {{if and (eq $.FilterBy "category") (eq $index $.Id)}}active{{end}}">${category}</a></li>
//         `;
//         categoriesContainer.insertAdjacentHTML('beforeend', categoryHTML);
//     });
// })
// .catch(error => console.error('Error fetching categories:', error));


// fetch('your-api-endpoint')
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json();
//   })
//   .then(categories => {
//     // Verify that the response data is structured correctly
//     console.log(categories);

//     // Assuming you're trying to set innerHTML of an element with ID 'category-list'
//     const categoryList = document.getElementById('category-list');

//     // Check if the element exists
//     if (categoryList) {
//       // Proceed to set the innerHTML only if the element exists
//       categoryList.innerHTML = categories.map(category => `<p>${category.name}</p>`).join('');
//     } else {
//       // Handle the case where the element doesn't exist
//       console.error('Error: Element with ID "category-list" not found.');
//     }
//   })
//   .catch(error => console.error('Error fetching or handling categories:', error));

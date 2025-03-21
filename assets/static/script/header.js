/* document.addEventListener('DOMContentLoaded', function() {
  fetch('/posts')
  .then(response => response.json())
  .then(data => {
      console.log(data);

      const navActionsContainer = document.querySelector('.nav-actions');

      if (!navActionsContainer) {
          console.error('Navigation actions container not found.');
          return;
      }

      navActionsContainer.innerHTML = ''; 

      if (data.isValidSession) {
          navActionsContainer.insertAdjacentHTML('beforeend', createPostHTML);
          navActionsContainer.insertAdjacentHTML('beforeend', logoutHTML);
      }

      attachEventListeners();
  })
  .catch(error => console.error('Error fetching session info:', error));

  
});

function attachEventListeners() {
  document.getElementById('logout-btn').onclick = function () {
      fetch('/logout', {
          method: 'POST',
          credentials: 'include', 
      })
      .then(response => {
          if (response.ok) {
              showMessage("Logout successful!");
              setTimeout(() => {
                  window.location.href = '/signup';
              }, 2000);
          } else {
              return response.json().then(errorData => {
                  showMessage(errorData.message);
              });
          }
      })
      .catch(error => {
          console.error('Error logging out:', error);
          showMessage("An error occurred during logout.");
      });
  };

  document.getElementById('new-post').onclick = function () {
      // Logic for opening new post modal or page
      fetch('/new-post', {
          method: 'GET',
          credentials: 'include', // Ensures cookies are sent with the request
      })
      .then(response => {
          if (response.ok) {
              // Show new post modal or redirect to new post page
              // For now, just log a message
              console.log("New post page or modal should be shown here.");
          } else {
              return response.json().then(errorData => {
                  showMessage(errorData.message);
              });
          }
      })
      .catch(error => {
          console.error('Error opening new post:', error);
          showMessage("An error occurred while opening new post.");
      });
  };
}
 */
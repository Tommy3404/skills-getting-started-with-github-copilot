document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML: show a bulleted list or a small note when empty

        const participantsHTML = details.participants && details.participants.length
          ? `
            <div class="participants">
              <h5 class="participants-title">Participants (${details.participants.length})</h5>
              <div class="participants-list">
                ${details.participants.map((p) => `
                  <span class="participant-chip" data-activity="${name}" data-email="${p}">
                    <span class="participant-email">${p}</span>
                    <button class="delete-participant" title="Remove participant" data-activity="${name}" data-email="${p}">&times;</button>
                  </span>
                `).join("")}
              </div>
            </div>
          `
          : `
            <div class="participants">
              <h5 class="participants-title">Participants</h5>
              <p class="participants-empty">No participants yet</p>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;


        activitiesList.appendChild(activityCard);

        // Add event listeners for delete buttons after rendering
        const deleteButtons = activityCard.querySelectorAll('.delete-participant');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const activity = btn.getAttribute('data-activity');
            const email = btn.getAttribute('data-email');
            if (!activity || !email) return;
            if (!confirm(`Remove ${email} from ${activity}?`)) return;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (response.ok) {
                fetchActivities(); // Refresh list
              } else {
                alert(result.detail || 'Failed to remove participant.');
              }
            } catch (err) {
              alert('Error removing participant.');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

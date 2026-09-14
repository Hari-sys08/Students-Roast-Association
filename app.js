const polls = [
  {
    id: "poll-1",
    question: "Which school moment deserves its own documentary?",
    options: [
      "The canteen rush",
      "The last day before holidays",
      "An unexpected free period",
      "Monday first period"
    ],
    votes: [42, 31, 57, 19]
  },
  {
    id: "poll-2",
    question: "What instantly improves a school day?",
    options: [
      "A free period",
      "Good food",
      "A cancelled test",
      "Getting dismissed early"
    ],
    votes: [34, 29, 61, 48]
  }
];

const memes = [
  {
    id: "meme-1",
    caption: "When the teacher says “this won't be in the exam.”",
    rating: 4.4,
    ratings: 38
  },
  {
    id: "meme-2",
    caption: "POV: you opened the textbook five minutes before the test.",
    rating: 4.7,
    ratings: 52
  },
  {
    id: "meme-3",
    caption: "That one friend who asks “what homework?” after you sent it three times.",
    rating: 4.1,
    ratings: 27
  }
];

const $ = selector => document.querySelector(selector);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function updateStats() {
  const totalVotes = polls.reduce((total, poll) => {
    return total + poll.votes.reduce((sum, count) => sum + count, 0);
  }, 0);

  $("#statVotes").textContent = totalVotes;
  $("#statMemes").textContent = memes.length;
  $("#statIdeas").textContent = 12;
}

function showPollResults(card, poll) {
  const total = poll.votes.reduce((sum, count) => sum + count, 0) || 1;

  card.querySelector(".results").classList.add("show");

  card.querySelectorAll(".result-row").forEach((row, index) => {
    const percentage = Math.round((poll.votes[index] / total) * 100);

    row.querySelector(".pct").textContent = `${percentage}%`;
    row.querySelector("i").style.width = `${percentage}%`;
  });
}

function renderPolls() {
  $("#pollList").innerHTML = polls.map(poll => {
    return `
      <article class="poll-card" data-poll-id="${poll.id}">
        <p class="eyebrow">quick poll</p>
        <h3>${escapeHTML(poll.question)}</h3>

        <div>
          ${poll.options.map((option, index) => `
            <button class="option" data-option-index="${index}">
              <span>${escapeHTML(option)}</span>
              <span>→</span>
            </button>
          `).join("")}
        </div>

        <div class="results">
          ${poll.options.map(option => `
            <div class="result-row">
              <div class="result-label">
                <span>${escapeHTML(option)}</span>
                <span class="pct">0%</span>
              </div>
              <div class="bar"><i style="width:0%"></i></div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".poll-card").forEach(card => {
    const poll = polls.find(item => item.id === card.dataset.pollId);

    card.querySelectorAll(".option").forEach(button => {
      button.addEventListener("click", async () => {
        if (localStorage.getItem(`sra-voted-${poll.id}`)) {
          showToast("You've already voted on this one.");
          return;
        }

        const selectedIndex = Number(button.dataset.optionIndex);

        localStorage.setItem(`sra-voted-${poll.id}`, "true");

        poll.votes[selectedIndex]++;

        card.querySelectorAll(".option").forEach(option => {
          option.classList.remove("voted");
        });

        button.classList.add("voted");

        showPollResults(card, poll);
        updateStats();
        showToast("Vote counted.");

        // Will connect to EdgeOne after KV approval.
        try {
          await fetch("/api/sra-vote", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              pollId: poll.id,
              option: selectedIndex
            })
          });
        } catch {
          // Demo mode continues working locally.
        }
      });
    });
  });
}

function renderMemes() {
  $("#memeList").innerHTML = memes.map(meme => {
    return `
      <article class="meme-card">
        <div class="meme-image">meme preview</div>

        <div class="meme-body">
          <p>${escapeHTML(meme.caption)}</p>

          <div class="stars" data-meme-id="${meme.id}">
            ${[1, 2, 3, 4, 5].map(star => `
              <button
                class="star ${star <= Math.round(meme.rating) ? "on" : ""}"
                data-rating="${star}"
                aria-label="${star} stars"
              >★</button>
            `).join("")}
          </div>

          <div class="rating-note">
            ${meme.rating.toFixed(1)} average · ${meme.ratings} ratings
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".stars").forEach(group => {
    group.querySelectorAll(".star").forEach(button => {
      button.addEventListener("click", () => {
        const meme = memes.find(item => item.id === group.dataset.memeId);
        const rating = Number(button.dataset.rating);
        const storageKey = `sra-rated-${meme.id}`;

        if (localStorage.getItem(storageKey)) {
          showToast("You've already rated this meme.");
          return;
        }

        localStorage.setItem(storageKey, String(rating));

        meme.rating =
          ((meme.rating * meme.ratings) + rating) /
          (meme.ratings + 1);

        meme.ratings++;

        renderMemes();
        updateStats();
        showToast("Rating saved.");
      });
    });
  });
}

$("#submissionForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const status = $("#formStatus");

  if (!data.message.trim()) {
    return;
  }

  status.textContent = "Sending…";

  try {
    const response = await fetch("/api/sra-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("KV is not active");
    }

    form.reset();
    status.textContent = "Sent. Thanks for adding to the board.";
  } catch {
    status.textContent =
      "The form is ready. Saving will activate after KV approval.";
  }
});

$("#memeFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  const status = $("#uploadStatus");

  if (!file) {
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Keep images under 5 MB.");
    event.target.value = "";
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showToast("Only PNG, JPEG and WebP files are allowed.");
    event.target.value = "";
    return;
  }

  status.textContent = "Preparing upload…";

  try {
    const response = await fetch("/api/sra-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: file.name,
        contentType: file.type
      })
    });

    if (!response.ok) {
      throw new Error("Upload route unavailable");
    }

    const uploadData = await response.json();

    const upload = await fetch(uploadData.url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });

    if (!upload.ok) {
      throw new Error("Upload failed");
    }

    status.textContent = "Uploaded to the moderation queue.";
    showToast("Meme received.");
  } catch {
    status.textContent =
      "Blob upload is prepared, but the upload route is not deployed yet.";
  }
});

renderPolls();
renderMemes();
updateStats();
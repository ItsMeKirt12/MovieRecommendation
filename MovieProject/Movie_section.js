const API_KEY = "c6b43c22b64d0628b0bdcbf7f9459676";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const sectionMovies = document.getElementById("movie-container");
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const current = document.getElementById('current');
const form = document.getElementById('form');
const input = document.getElementById('inpt');

let currentPage = 1;
let totalPages = 100;
let currentSearch = '';


// for movie section
const initialUrl = `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${currentPage}&sort_by=popularity.desc&api_key=${API_KEY}`;
returnMovies(initialUrl);
document.addEventListener("DOMContentLoaded", function () {
  const homeLink = document.querySelector('.movies');

  homeLink.addEventListener('click', function(event) {
      event.preventDefault();
      const targetId = homeLink.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
      }
  });
  document.getElementById('movieModal').style.display = 'none';
});

function returnMovies(url) {
  fetch(url)
    .then((res) => res.json())
    .then(function (data) {
      if (data.results && data.results.length > 0) {
        displayMovies(data.results);
        currentPage = data.page;
        totalPages = data.total_pages;
        current.innerText = currentPage;
        handlePagination();
      } else {
        sectionMovies.innerHTML = "<h1 class='no-results'>No Results Found</h1>";
      }
    })
    .catch(function (error) {
      console.error("Error fetching data:", error);
    });
}

// It display the movie in movie section
function displayMovies(movies) {
  sectionMovies.innerHTML = "";
  movies.forEach((movie) => {
    const roundedVoteAverage = movie.vote_average.toFixed(1);
    const { title, poster_path, release_date, id } = movie;
    const releaseYear = (release_date && release_date.split('-')[0]) || '';
    const movieDetailsUrl = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`;

      fetch(movieDetailsUrl)
        .then((res) => res.json())
        .then((details) => {
          const genres = details.genres.map(genre => genre.name).slice(0, 2).join(', ');
          const movieCard = document.createElement("div");
          movieCard.classList.add("movie_poster");
          movieCard.innerHTML = `
            <img src="${
              poster_path
                ? IMG_URL + poster_path
                : "http://via.placeholder.com/1080x1580"
            }" alt="${title}" class="images" />
            <div class="movieInfos">
              <div class="movieTitle">
                <h3>${title}</h3>
              </div>
              <div class="ratingsAndDate">
                <span class="releaseDate">${releaseYear}</span>
                <div class="movieRatings">
                  <h3 class="${movieRatings(roundedVoteAverage)}">${roundedVoteAverage}</h3>
                </div>
              </div>
            </div>
            <div class="genres">
              <span class="genre">${genres}</span>
            </div>
          `;
          movieCard.addEventListener('click', () => openMovieDetails(details));
          sectionMovies.appendChild(movieCard);
        })
        .catch((error) => {
          console.error("Error fetching movie details:", error);
        });
  });
}

// Pop-Up movie Details
function openMovieDetails(details) {
  const modalContent = document.getElementById('modalContent');
  const posterUrl = details.poster_path ? IMG_URL + details.poster_path : "http://via.placeholder.com/500x750";
  const trailerUrl = `${BASE_URL}/movie/${details.id}/videos?api_key=${API_KEY}&language=en-US`;
  const castUrl = `${BASE_URL}/movie/${details.id}/credits?api_key=${API_KEY}`;

  const storedComments = JSON.parse(localStorage.getItem('movieComments')) || {};
  const movieId = details.id;

  Promise.all([fetch(trailerUrl), fetch(castUrl)])
    .then(([trailerRes, castRes]) => Promise.all([trailerRes.json(), castRes.json()]))
    .then(([trailerData, castData]) => {
      const trailerKey = trailerData.results.length > 0 ? trailerData.results[0].key : null;
      const cast = castData.cast.slice(0, 5);

      // Display movie details in the modal with background image and trailer
      modalContent.innerHTML = `
        <div class="movieDetails">
          <img src="${posterUrl}" alt="${details.title}" class="modalPoster" />
          <div class="mInfo">
            <h1>${details.title}</h1>
            <p><strong>Genre:</strong> ${details.genres.map(genre => `<li class="genreName">${genre.name}</li>`).slice(0, 3).join(', ')}</p>
            <p><strong>Ratings:</strong> ${details.vote_average.toFixed(1)}</p>
            <div class="casts"><strong>Cast:</strong> ${cast.map(actor => `<li class="casts">${actor.name}</li>`).join(',')}</div>
            <p><strong>Release Date:</strong> ${details.release_date}</p>
            <p><strong>Overview:</strong> ${details.overview}</p>
          </div>
        </div>
        <div class="movieTrailer">
          ${trailerKey ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailerKey}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>` : ''}
        </div>
        <div class="commentSection">
          <div class="commentHead">
            <h2>Post a Comment</h2>
          </div>
          <div class="commentHeader"><span id="comment">${getCommentCount(movieId)}</span> Comment</div>
          <div class="comments">${getStoredComments(movieId)}</div>
          <div class="commentBox">
            <img src="user1.png" alt="">
            <div class="content">
              <h2>Comment As:</h2>
              <input type="text" placeholder="Username:" class="user">
              <div class="commentInput">
                <input type="text" placeholder="Enter Comment..." class="userComment">
                <div class="publishBtn">
                  <button type="submit" disabled id="publish">Publish</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      const comments = getStoredComments(movieId);
      document.querySelector('.comments').innerHTML = comments;

      const publishButton = document.getElementById('publish');
      const userComment = document.querySelector('.userComment');
      const comment = document.querySelector('.comments');
      const userName = document.querySelector('.user');

      function userCommentInput() {
        if (!userComment.value) {
          publishButton.setAttribute('disabled', 'disabled');
          publishButton.classList.remove('abled');
        } else {
          publishButton.removeAttribute('disabled');
          publishButton.classList.add('abled');
        }
      }

      function addPost() {
        if (!userComment.value) return;
        const commentId = new Date().getTime();
        const newComment = {
          id: commentId,
          name: userName.value,
          identity: userName.value ? true : false,
          image: userName.value ? "user.png" : "anonymous.png",
          message: userComment.value,
          date: new Date().toLocaleString()
        };

        addCommentToStorage(movieId, newComment);
        updateCommentSection(comment, newComment, storedComments, movieId);
        userComment.value = "";
        userName.value = "";

        let commentNum = Object.keys(storedComments[movieId] || {}).length;
        document.getElementById("comment").textContent = commentNum;
      }

      publishButton.addEventListener("click", addPost);
      userComment.addEventListener('input', userCommentInput);
      document.getElementById('movieModal').style.display = 'block';
    })
    .catch((error) => {
      console.error("Error fetching trailer and cast details:", error);
    });
 
}
function getCommentCount(movieId) {
  const storedComments = JSON.parse(localStorage.getItem('movieComments')) || {};
  const comments = storedComments[movieId] || {};
  return Object.keys(comments).length || 0;
}

function addCommentToStorage(movieId, comment) {
  const storedComments = JSON.parse(localStorage.getItem('movieComments')) || {};
  storedComments[movieId] = storedComments[movieId] || {};
  storedComments[movieId][comment.id] = comment;
  localStorage.setItem('movieComments', JSON.stringify(storedComments));

  // Update the comment count when a new comment is added
  updateCommentCount(movieId);
}

function getStoredComments(movieId) {
  const storedComments = JSON.parse(localStorage.getItem('movieComments')) || {};
  const comments = storedComments[movieId] || {};
  return Object.values(comments).map(comment => renderComment(comment)).join('');
}

function renderComment(comment) {
  return `
    <div class="parent">
      <img src="${comment.image}">
      <div>
        <h2>${comment.name}</h2>
        <p>${comment.message}</p>
        <div class="react"><img src="like.png"><img src="share.png"></div>
        <span class="date">${comment.date}</span>
      </div>
    </div>
  `;
}
function updateCommentSection(commentSection, newComment, storedComments, movieId) {
  storedComments[movieId] = storedComments[movieId] || {};
  storedComments[movieId][newComment.id] = newComment;
  commentSection.innerHTML = Object.values(storedComments[movieId] || {}).map(comment => renderComment(comment)).join('');
  updateCommentCount(movieId);
}

function updateCommentCount(movieId) {
  const commentCount = getCommentCount(movieId);
  document.getElementById('comment').textContent = commentCount;
}
//For Comment Section: 
const userId = {
  name: null,
  identity:null,
  image:null,
  message:null,
  date:null
}

// close button function for pop up movie details 
function closeMovieDetails() {
    document.getElementById('movieModal').style.display = 'none';
}


//ratings color base on their vote_average
function movieRatings(rating) {
  if (rating >= 8) {
    return 'green';
  } else if (rating >= 5) {
    return 'orange';
  } else {
    return 'red';
  }
}

//pagination
function handlePagination() {
  if (currentPage <= 1) {
    prev.classList.add('disabled');
  } else {
    prev.classList.remove('disabled');
  }

  if (currentPage >= totalPages) {
    next.classList.add('disabled');
  } else {
    next.classList.remove('disabled');
  }
}

function goToPrevPage() {
  if (currentPage > 1) {
    const prevUrl = currentSearch ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentSearch}&page=${currentPage - 1}` :
      `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${currentPage - 1}&sort_by=popularity.desc&api_key=${API_KEY}`;

    returnMovies(prevUrl);

    const movieSection = document.getElementById('movie-sect');
    if (movieSection) {
      movieSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function goToNextPage() {
  if (currentPage < totalPages) {
    const nextUrl = currentSearch ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentSearch}&page=${currentPage + 1}` :
      `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${currentPage + 1}&sort_by=popularity.desc&api_key=${API_KEY}`;

      returnMovies(nextUrl);

    const movieSection = document.getElementById('movie-sect');
    if (movieSection) {
      movieSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

//for Search Input
function handleSearch(e) {
  e.preventDefault();
  const searchValue = input.value;
  if (searchValue && searchValue !== '') {
    currentSearch = searchValue;
    const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchValue}&page=1`;
    returnMovies(searchUrl);
    input.value = '';

    
    // Redirect to the movie section after searching for a movie
    const movieSection = document.getElementById('movie-sect');
    if (movieSection) {
      movieSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
function resetPage() {
  const resetUrl = `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&api_key=${API_KEY}`;
  returnMovies(resetUrl);
}
document.addEventListener("DOMContentLoaded", function () {
  const homeLink = document.querySelector('.movies');

  homeLink.addEventListener('click', function(event) {
      event.preventDefault();
      const targetId = homeLink.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      // Reset the search
      currentSearch = '';
      if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          resetPage();
      }
      
  });   // Check if there is a stored scroll position in localStorage
  const storedScrollPosition = localStorage.getItem('scrollPosition');
  if (storedScrollPosition) {
    // Restore the scroll position
    window.scrollTo(0, storedScrollPosition);
  }
});
window.addEventListener('beforeunload', function () {
  const scrollPosition = window.scrollY;
  localStorage.setItem('scrollPosition', scrollPosition);
});


prev.addEventListener('click', goToPrevPage);
next.addEventListener('click', goToNextPage);
form.addEventListener('submit', handleSearch);







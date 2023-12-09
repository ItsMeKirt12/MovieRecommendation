document.addEventListener("DOMContentLoaded", async function () {
  const API_KEY = "c6b43c22b64d0628b0bdcbf7f9459676";

  const fetchMovieGenres = async (genre_ids) => {
    const genreMapping = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
    };
    return genre_ids.map((genre_id) => genreMapping[genre_id]).join(", ");
  };
  
  // Function to fetch movie details and cast
  async function fetchMovieDetails(movieId) {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
    );

    if (response.ok) {
      const movieDetails = await response.json();
      return movieDetails;
    } else {
      throw new Error("Failed to fetch movie details");
    }
  }

  try {
    // Fetch a list of popular movies
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=&language=en-US&page=1&sort_by=popularity.desc&api_key=${API_KEY}`
    );
    const data = await response.json();
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const movie = data.results[randomIndex];
    const movieId = movie.id;

    // Fetch movie details including the cast
    const movieDetails = await fetchMovieDetails(movieId);

    // Access the cast details
    const cast = movieDetails.credits.cast;
    const mainCharacters = cast.filter((actor) => actor.order <= 5);
    const mainCharacterNames = mainCharacters
      .map((actor) => actor.name)
      .join(", ");
    document.getElementById("castNames").textContent = mainCharacterNames;
    
    const release_date = movie.release_date;
    const releaseYear = (release_date && release_date.split("-")[0]) || '';
    
    // Set the release year in the HTML element with class "movie_year"
    document.querySelector(".movie_year span").textContent = releaseYear;


    const genreData = await fetchMovieGenres(movie.genre_ids);
    document.querySelector(".movieGenre").textContent = genreData;

    const movieTitle = movie.title;
    document.querySelector(".logo_container h1").textContent = movieTitle;

    const movieOverview = movie.overview;
    document.querySelector(".movie_info_synopsis").textContent = movieOverview;

    const movieRating = determineMovieRating(movie);
    document.querySelector(".movie_rated span").textContent = movieRating;
    function determineMovieRating(movie) {
      const contentRating = movie.content_rating; 
    
      if (contentRating === "PG-13" || contentRating === "R") {
        return "13+";
      } else if (contentRating === "NC-17" || contentRating === "Adult") {
        return "18+";
      }
      // Default to PG if no specific criteria are met
      else{
        return "PG"; 
      } 
    }

    const movieRatings = movie.vote_average;
    const ratingsElement = document.querySelector(".ratings");

    if (movieRatings >= 8) {
      ratingsElement.textContent = movieRatings;
      ratingsElement.classList.add("green");
    } else if (movieRatings >= 5) {
      ratingsElement.textContent = movieRatings;
      ratingsElement.classList.add("orange");
    } else {
      ratingsElement.textContent = movieRatings;
      ratingsElement.classList.add("red");
    }

    const movielanguage = movie.original_language;
    document.querySelector(".language").textContent = movielanguage;

    const movieBackdrop = movie.backdrop_path;
    const backdropUrl = `https://image.tmdb.org/t/p/original${movieBackdrop}`;
    document.querySelector(".poster").src = backdropUrl;
  } catch (error) {
    console.error("Error:", error);
  }
  
    
});



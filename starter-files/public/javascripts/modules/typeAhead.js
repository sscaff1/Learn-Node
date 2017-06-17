import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
  return stores
    .map(
      store => `
    <a href="/store/${store.slug}" class="search__result">
      <strong>${store.name}</strong>
    </a>
  `
    )
    .join('');
}

function handleKeyUp({ keyCode }) {
  const activeClass = 'search__result--active';
  const current = this.querySelector(`.${activeClass}`);
  const items = this.querySelectorAll('.search__result');
  let next;
  switch (keyCode) {
    case 13: {
      if (current.href) {
        window.location = current.href;
        return;
      }
      break;
    }
    case 38: {
      if (current) {
        next = current.previousElementSibling || items[items.length - 1];
      } else {
        next = items[items.length - 1];
      }
      break;
    }
    case 40: {
      if (current) {
        next = current.nextElementSibling || items[0];
      } else {
        next = items[0];
      }
      break;
    }
    default: {
      return;
    }
  }
  if (current) {
    current.classList.remove(activeClass);
  }
  next.classList.add(activeClass);
}

export default function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');
  searchInput.on('input', function() {
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }
    searchResults.style.display = 'block';
    searchResults.innerHTML = '';
    axios
      .get(`/api/search?q=${this.value}`)
      .then(({ data }) => {
        if (data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(data));
        } else {
          searchResults.innerHTML = dompurify.sanitize(`
            <div class="search__result">
              No results for ${this.value} found!
            </div>
          `);
        }
      })
      .catch(err => console.error(err));
  });

  searchInput.on('keyup', handleKeyUp.bind(search));
}

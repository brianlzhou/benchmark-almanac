// LiveOCRVQA ranks models by overall accuracy on stylized text questions in its project page table.
import { htmlBoard } from './geomap-bench.ts';

export default htmlBoard({
  "benchmark": "liveocrvqa",
  "url": "https://flageval-baai.github.io/LiveOCRVQA/",
  "feed": "https://flageval-baai.github.io/LiveOCRVQA/",
  "terms": "The publisher displays results at https://flageval-baai.github.io/LiveOCRVQA/. I could not verify reuse terms. The robots.txt route returns HTML.",
  "model": "Model",
  "score": "Overall",
  "minimum": 21,
  "parts": {
    "album": "Album",
    "book": "Book",
    "game": "Game",
    "movie": "Movie"
  }
});

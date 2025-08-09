async function fetchWikipediaSummary(query, wordLimit) {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("No results found");
        const data = await response.json();

        // Check if it's a disambiguation page
        if (data.type === "disambiguation") {
            let message = `${data.extract}\n\nHere are related topics:\n`;
            if (data.content_urls && data.content_urls.desktop) {
                // Extract topics from the disambiguation page
                const relatedTopics = await fetchDisambiguationTopics(data.content_urls.desktop.page);
                message += relatedTopics.join("\n");
            } else {
                message += "No further links are available.";
            }
            return message;
        }

        // For normal pages, limit by words
        const words = data.extract.split(" ").slice(0, wordLimit);
        return words.join(" ");
    } catch (error) {
        return "Error: Unable to fetch data from Wikipedia.";
    }
}

async function fetchDisambiguationTopics(disambiguationUrl) {
    try {
        const response = await fetch(disambiguationUrl);
        if (!response.ok) throw new Error("Unable to fetch disambiguation topics.");
        const html = await response.text();

        // Parse the HTML content to find links (basic web scraping)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const links = Array.from(doc.querySelectorAll("ul > li > a"))
            .map((link) => link.textContent.trim()) // Get text content of links
            .slice(0, 10); // Limit to 10 topics
        return links.length > 0 ? links : ["No related topics found."];
    } catch (error) {
        return ["Error fetching disambiguation topics."];
    }
}

function typeWriter(text, elementId, speed = 50) {
    const displayBox = document.getElementById(elementId);
    displayBox.innerHTML = ""; // Clear previous text
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            displayBox.innerHTML += text[i];
            i++;
        } else {
            clearInterval(interval);
        }
    }, speed);
}

const searchButton = document.getElementById("search-button");
const searchBox = document.getElementById("search-box");
const wordLimitSlider = document.getElementById("word-limit");
const wordLimitDisplay = document.getElementById("word-limit-display");

wordLimitSlider.addEventListener("input", () => {
    wordLimitDisplay.textContent = wordLimitSlider.value;
});

searchButton.addEventListener("click", async () => {
    const query = searchBox.value.trim();
    const wordLimit = parseInt(wordLimitSlider.value, 10);

    if (query === "") {
        alert("Please enter a search term.");
        return;
    }

    const text = await fetchWikipediaSummary(query, wordLimit);
    typeWriter(text, "display-box", 50);
});

function updateSliderBackground(slider) {
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #4964dc ${value}%, #ddd ${value}%)`;
}

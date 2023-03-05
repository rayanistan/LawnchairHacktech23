// In order to use this extension,
// you must obtain an OpenAI GPT-3 APIKey.
// You can obtain one here: https://platform.openai.com/account/api-keys
// Once you obtain your APIKey, past it between the '' below:
const apiKey = '';

// Store question for GPT-3 and GPT-3's response.
const questionElement = document.getElementById('question');
const responseElement = document.getElementById('response');

function getWebsiteName(url) {
  // Remove "www." and ".com"
  let websiteName = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/.*$/, '');
  // Remove subdomains
  websiteName = websiteName.split('.').slice(-2, -1)[0];
  // Convert to uppercase
  websiteName = websiteName.charAt(0).toUpperCase() + websiteName.slice(1);
  return websiteName;
}
function parseString(str) {
  // define regular expressions to match key-value pairs
  const colorRegex = /Color:\s*(.*)/i;
  const brandRegex = /Brand:\s*(.*)/i;
  const typeRegex = /Clothing\s+Type:\s*(.*)/i;

  // match the regular expressions to the input string and extract the values
  const colorMatch = str.match(colorRegex);
  const brandMatch = str.match(brandRegex);
  const typeMatch = str.match(typeRegex);

  // return the extracted values in a list
  return [colorMatch ? colorMatch[1].trim() : '',
          brandMatch ? brandMatch[1].trim() : '',
          typeMatch ? typeMatch[1].trim() : ''];
}
//Iterating through product list
function printKeys(objArray) {
  for (let i = 0; i < objArray.length; i++) {
    const obj = objArray[i];
    for (const key in obj) {
      console.log(key);
    }
  }
}

//Get merchant links 
function getMerchantLinks(objArr) {
  const links = [];
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    const link = obj["merchantLink"];
    links.push(link);
  }
  return links;
}
function getMerchantimgs(objArr) {
  const links = [];
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    const link = obj["merchantLink"];
    links.push(getImageUrlFromUrl(link));
  }
  return links;
}
//Get alternative clothing data from scraper 
async function fetchClothingData(color, clothingType) {
  const options = {
      method: 'POST', 
      headers: {
         'Authorization': 'Bearer apify_api_gUqtBHeELUa6XgBndhGzWwSvUPyMGy0rNz45',
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "maxItems": 4,
        "maxItemsPerQuery": 4,
        "proxy": {
            "useApifyProxy": true,
            "apifyProxyGroups": [
                "GOOGLE_SERP"
            ],
            "apifyProxyCountry": "US"
        },
        "queries": [
            `${color} ${clothingType} Sustainable`
        ]
      })
  };
  const result = await fetch('https://api.apify.com/v2/acts/epctex~google-shopping-scraper/run-sync-get-dataset-items', options);
  const record = await result.json();
  return record;
}
// JavaScript
async function previewLink() {
  const linkInput = document.getElementById('link-input');
  const url = linkInput.value;
  const imageUrl = await getImageUrlFromUrl(url);

  const previewContainer = document.getElementById('preview-container');
  previewContainer.innerHTML = `
    <a href="${url}" target="_blank">
      <img src="${imageUrl}" alt="Preview image">
      <p>${url}</p>
    </a>
  `;
}
const { JSDOM } = require('jsdom');
const { nltk } = require('natural');
nltk.download('stopwords');
nltk.download('punkt');

function extractClothingSummary(html) {
  // Create a DOM object from the HTML
  const dom = new JSDOM(html);
  
  // Get the text content of the document
  const text = dom.window.document.body.textContent;
  
  // Tokenize the text into sentences
  const sentences = nltk.sent_tokenize(text);
  
  // Define a list of clothing words to search for
  const clothingWords = ['shirt', 'pants', 'dress', 'jacket', 'coat', 'blouse', 'skirt', 'shorts', 'jeans', 'sweater'];
  
  // Find sentences that mention clothing
  const clothingSentences = sentences.filter(sentence => {
    const words = nltk.word_tokenize(sentence);
    const filteredWords = words.filter(word => !nltk.corpus.stopwords.words('english').includes(word.toLowerCase()));
    const clothingCount = filteredWords.filter(word => clothingWords.includes(word.toLowerCase())).length;
    return clothingCount > 0;
  });
  
  // Return a summary of the clothing mentioned
  let summary = '';
  const clothingTypes = new Set();
  clothingSentences.forEach(sentence => {
    const words = nltk.word_tokenize(sentence);
    const filteredWords = words.filter(word => !nltk.corpus.stopwords.words('english').includes(word.toLowerCase()));
    const clothing = filteredWords.filter(word => clothingWords.includes(word.toLowerCase()));
    clothing.forEach(item => clothingTypes.add(item.toLowerCase()));
  });
  if (clothingTypes.size === 0) {
    summary = 'No clothing mentioned in the document.';
  } else {
    summary = `The following clothing types were mentioned in the document: ${Array.from(clothingTypes).join(', ')}.`;
  }
  
  return summary;
}

// Example usage
const html = '<html><body><h1>Clothing Summary</h1><p>This document mentions dresses, skirts, and jackets.</p></body></html>';
console.log(extractClothingSummary(html)); // Output: "The following clothing types were mentioned in the document: dress, skirt, jacket."

async function getImageUrlFromUrl(url) {
  const html = await fetchHtml(url);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const img = doc.querySelector('meta[property="og:image"]') || doc.querySelector('img');
  return img ? img.src : null;
}

async function fetchHtml(url) {
  return fetch(url).then(response => response.text());
}
// Prepare API input
chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
  responseElement.innerText = "I'm sorry, but this webpage is not a valid WWW address. This extension can only handle internet-level webpages, not system-level ones.";
  
  const url = tabs[0].url;
  const domain = getWebsiteName(url);

  responseElement.innerText = "Loading...";

  const prompt = `Tell me the brand, color, and clothing type at this url ${url} based off what is in the url. If there is not enoguh info make your best guess:`;
  const temperature = 0.0;
  const maxTokens = 150;

  const body = {
    prompt,
    temperature,
    max_tokens: maxTokens,
  };
  // Define the searchBrandClothing function
  async function searchBrandClothing(brand, clothingType) {
    const apiKey = 'AIzaSyAs5BBDzFViU0d1p6Q2154908-hLSZVZvc';
    const searchEngineId = 'c537b5df398f14f40';
    const query = `${brand} ${clothingType}${'sustainable'}`;
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}&num=5`;
  
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const results = data.items.map(item => item.link);
      return results;
    } catch (error) {
      console.error(error);
    }
}
// Call API
try {
    const response = await fetch(`https://api.openai.com/v1/engines/text-davinci-003/completions?engine=text-davinci-003&prompt=${encodeURIComponent(prompt)}&temperature=${temperature}&max_tokens=${maxTokens}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
  
    // Ensure response is valid
    const data = await response.json();
    const answer = data.choices && data.choices.length > 0 ? data.choices[0].text.trim() + "..." : null;
    // Load the required libraries
const cv = require('opencv4nodejs');
const fs = require('fs');

// Define the function that detects objects of certain types based on typelist
function detectObjects(imagePath, typelist) {
  // Read the image
  const img = cv.imread(imagePath);
  
  // Create the classifier
  const classifier = new cv.CascadeClassifier();
  
  // Load the classifier with the haarcascade file for the specified type(s)
  typelist.forEach(type => {
    const cascadeFile = `./haarcascades/${type}.xml`;
    if (fs.existsSync(cascadeFile)) {
      classifier.load(cascadeFile);
    } else {
      console.error(`Error: Cascade file not found for type ${type}`);
    }
  });
  
  // Detect objects of the specified type(s) in the image
  const objects = classifier.detectMultiScale(img);
  
  // Draw rectangles around the detected objects
  objects.forEach(obj => {
    const point1 = new cv.Point2(obj.x, obj.y);
    const point2 = new cv.Point2(obj.x + obj.width, obj.y + obj.height);
    img.drawRectangle(point1, point2, new cv.Vec(0, 255, 0), 2);
  });
  
  // Display the image with detected objects
  cv.imshowWait('Detected Objects', img);
}

// Example usage
const imagePath = './example.jpg';
const typelist = ['face', 'eye'];
detectObjects(imagePath, typelist);

    if (answer) {
      // Parse the answer into a list of color, brand, and clothing type
      const typelist = parseString(answer);
      const imgurls = [];
      // Use the parsed values to search for results
      const results = await fetchClothingData(typelist[0], typelist[2]);
      for (const product of results) {
        img = getImageUrlFromUrl(product['merchantLink']);
        imgurls.push(img)
      }
      // Update the response element with the results
      responseElement.innerText = JSON.stringify(getMerchantLinks(results));
    } else {
      responseElement.innerText = "Error: No answer received from API.";
    }
  
  } catch (error) {
    responseElement.innerText = `Error: ${error.message}`;
  }
});
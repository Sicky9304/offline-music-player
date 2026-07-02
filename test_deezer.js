import axios from 'axios';

async function test() {
  const query = "eminem";
  const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`;
  console.log(`Querying Deezer: ${searchUrl}`);

  try {
    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });

    console.log("Status:", res.status);
    console.log("Data keys:", Object.keys(res.data || {}));
    if (res.data && res.data.data) {
      console.log("Results count:", res.data.data.length);
      if (res.data.data.length > 0) {
        console.log("First item:", JSON.stringify(res.data.data[0], null, 2));
      }
    } else {
      console.log("Raw response body:", res.data);
    }
  } catch (err) {
    console.error("Failed:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
  }
}

test();

export async function fetchCoordsFromAddress(query) {
  // const res = await fetch("http://localhost:3000/user", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ userId }),
  //   cache: "no-store",
  // });

  // if (!res.ok) throw new Error("Failed to fetch user");
  // return res.json();
  const token =
    "pk.eyJ1IjoianRzYTEiLCJhIjoiY2xzZnY2a3FqMXA3eTJrcGQ0Zm9lMzcxeiJ9.q2YaYHpNxS49n3dEdVlehg";
  //   // const encodedSearchQuery = encodeURIComponent(query || "")
  const url =
    "https://api.mapbox.com/search/geocode/v6/forward?q=" +
    query +
    "&access_token=" +
    token;
  //   alert(query);
  //   const hardurl =
  // "https://api.mapbox.com/search/geocode/v6/forward?q=63%20w%202nd%20ave%0A&access_token=pk.eyJ1IjoianRzYTEiLCJhIjoiY2xzZnY2a3FqMXA3eTJrcGQ0Zm9lMzcxeiJ9.q2YaYHpNxS49n3dEdVlehg";
  // console.log("Url: " + url)
  // console.log("UrlStatic: " + hardurl)
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return { found: false, data: null };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
  return { found: true, data };
}
export default fetchCoordsFromAddress;

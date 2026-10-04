// Open Street Map API to get nearby hospitals based on latitude and longitude
export const getNearbyHospitals = async (latitude, longitude) => {
  const radius = 5000; // 5 km

  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${latitude},${longitude});
      way["amenity"="hospital"](around:${radius},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;// Overpass API query to fetch hospitals within a 5 km radius of the given latitude and longitude

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: query,
    }
  ); // frontend sends the query to the Overpass API to get nearby hospitals based on the provided latitude and longitude

  if (!response.ok) {
    throw new Error("Failed to fetch nearby hospitals");
  }

  const data = await response.json();

  return data.elements.map((hospital) => {
    const lat = hospital.lat ?? hospital.center?.lat;
    const lon = hospital.lon ?? hospital.center?.lon;

    return {
      id: hospital.id,
      name: hospital.tags?.name || "Unnamed Hospital",
      latitude: lat,
      longitude: lon,
      address:
        hospital.tags?.["addr:full"] ||
        hospital.tags?.["addr:street"] ||
        "Address unavailable",
      phone: hospital.tags?.phone || "",
    };
  });
};

//For finding nearby hospitals, we use the Overpass API with OpenStreetMap data.
//  We send the patient's latitude and longitude along with a 5-kilometer search radius. 
// The API returns nearby hospital locations, and we extract relevant information such as
//  hospital name, coordinates, address, and phone number before displaying it in the frontend